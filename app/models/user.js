var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var saltRounds = 12;


var User = db.Model.extend({
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      console.log('User Model', attrs);
      return new Promise(function(resolve, reject) {
        bcrypt.hash(model.get('password'), saltRounds, function(err, hash) {
          if (err) {
            reject(err);
          } else {
            model.set('password', hash);
            resolve(null);
          }
        });
      });
    }); 
  }
});

module.exports = User;