var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
Promise.longStackTraces();

var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      console.log('User Model', attrs);
      return new Promise(function(resolve, reject) {
        bcrypt.hash(model.get('password'), null, null, function(err, hash) {
          if (err) {
            console.log('Error creating initial password hash  :', err);
            reject(err);
          } else {
            model.set('password', hash);
            resolve(null);
          }
        });
      });
    }); 
  },

  checkPassword: function(password, actualPassword) {
    return new Promise(function(resolve, reject) {
      bcrypt.compare(password, actualPassword, function(error, results) {
        if (error) {
          console.log('Error tying to check password:  ', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
});


module.exports = User;