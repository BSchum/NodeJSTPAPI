var Address = require('../../model/address.js');
var User = require('../../model/user.js');
var Group = require('../../model/group.js');
var helpers = require('../helpers.js');
var crypto = require('crypto');
const router = require('express').Router();


router.post('/login',function(req,res){
  var md5Hash = crypto.createHash('md5');
  User.findOne({login: req.body.login, password: req.body.password}, function(err, user){
    if(user != undefined){
      var token = md5Hash.update(user.login+"."+user.password);
      res.json({
        token: md5Hash.digest('hex'),
        message: "This is your auth token, please use it to acces other route in you headers request"
      });
    }else{
      res.json({
        auth: "failed"
      });
    }
  });
});

module.exports = router;
