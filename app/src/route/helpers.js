var Address = require('../model/address.js');
var User = require('../model/user.js');
var Group = require('../model/group.js');
const crypto = require('crypto');

// CETTE FONCTION PERMETS DE VERIFIER LE TOKEN DANS LE HEADER DE TA REQUETE
// IL FAUT DONC AJOUTER DANS LE HEADER : token: ET LE TOKEN QUE TU AS EU EN TE CONNECTANT VIA LA ROUTE AUTH EN PASSANT
// LES PARAMETRES LOGIN ET MDP
module.exports.compareHash = function compareHash(hashtest, callback){
  var userExist = false;
  User.find({deleted: false}, function(err, users){
    users.forEach(function(user){
      var hash = crypto.createHash('md5');
      hash.update(user.login+"."+user.password);
      var hashToCompare = hash.digest('hex');
      if(hashtest == hashToCompare){
        userExist = true;
      }
    });
    callback(userExist);
  });
}
