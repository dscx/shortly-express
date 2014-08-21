var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

initialize: function(){
  this.on('creating', this.generateHash);

},

// generating a hash
generateHash: function() {
    var crypto = Promise.promisify(bcrypt.hash);

      return crypto(this.get('password'), null, null)
        .bind(this)
        .then(function(hash){
          this.set('password', hash);
        });
},

// checking if password is valid
validPassword: function(pass, hash, cb) {

    bcrypt.compare(this.get('password'), hash, function(err, result){
      cb(result);
    });
}

});


module.exports = User;