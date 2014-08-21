var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

initialize: function(){
  this.on('creating', function(model, attrs, options){
      // console.log(model, 'userjs line 10');
    User.generateHash(model.get('password'), function(err, result){

    model.set('password', result);
    console.log(model);
    });
    // setTimeout( function(){ console.log(model, 'userjs line 15')}, 1000);
  });

}

});



// generating a hash
User.generateHash = function(password, cb) {
    bcrypt.hash(password, bcrypt.genSaltSync(8), null, cb);
    // return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
User.validPassword = function(password, hash) {
  console.log(hash, "THIS IS THIS IS THIS");
    return bcrypt.compareSync(password, hash);
};

module.exports = User;