var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

///auth reuires
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

///auth modules
app.use(session({
  secret: 'nyan cat',
}));
app.use(cookieParser('shhhh, very secret'));

var restrict = function(req, res, next){
  if (req.session.user){
    next();
  } else {
    req.session.error = "Access Denied!";
    res.redirect('/login');
  }
};
  
app.get('/', function(req, res){
  restrict(req, res, function(){
    res.render('index');
  });
});

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.get('/create', function(req, res) {
  restrict(req, res, function() { 
    res.render('index');
  });
});

app.get('/links', 
function(req, res) {
  restrict(req, res, function(){
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });
});

app.get('/logout'),
  function(req, res){
    req.session.destroy(function(){
      res.redirect('/login');
    });
  };


app.post('/links', function(req, res) {
  var uri = req.body.url;
  restrict(req, res, function(){
    console.log('Not a valid url: ', uri);

  if (!util.isValidUrl(uri)) {
    return res.send(404);
  } 

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        } 
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  }); 
  
  });

}); 

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login',
  function(req, res){

  new User({username:req.body.username}).fetch()
    .then(function(found){
      if(found){
         found.validPassword(req.body.password, found.get('password'), function(){
            req.session.regenerate(function(){
              req.session.user = req.body.username;
              res.location('/');
              res.send(200);
            });
      //bcrypt.compare(req.body.password, found.get('password'), function(){

      //   req.session.regenerate(function(){
      //     req.session.user = req.body.username;
      //     res.location('/');
      //     res.send(200);
      // })
        // })
       });
      } else {
        res.redirect('/login');
      }
    });
  });


app.post('/signup', function(req, res){
  new User({username:req.body.username}).fetch().then(function(found){
    if(!found){
        util.addUser(req, res);
    } else {
        res.location('/');
        res.send(req.body);
    }
  });
});
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
