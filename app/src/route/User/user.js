var Address = require('../../model/address.js');
var User = require('../../model/user.js');
var Group = require('../../model/group.js');
var helpers = require('../helpers.js');
var crypto = require('crypto');
const router = require('express').Router();

// USER CRUD
//TODO HASH PASSWORD BEFORE REGISTER TO BDD
// create a user, with an address and a group ( register to the group/address if already exist, create them if dont)
router.post('/register', function(req, res){
  var users = new User({
    nom: req.body.nom,
    prenom: req.body.prenom,
    tel: req.body.tel,
    login: req.body.login,
    password: req.body.password,
    group: [],
    address: [],
    deleted: false
  });
  var group = new Group({
    title: req.body.groupTitle,
    description: req.body.groupDesc,
    deleted: false
  });
  Group.findOne({title: req.body.groupTitle}, function(err, findGroup){
    if(err){
      res.send(err);
    }else{
      if(findGroup != null){
        users.group.push(findGroup);
        findGroup.user.push(users._id);
        var userGroup = findGroup.user;
        Group.update({_id: findGroup._id},{user: userGroup},function(err, group){
          if(err){
            res.send(err);
          }
        });
        
        
      }else{
        group.user = users;
        group.save(function(err){
        });
        users.group = group;
      }
    }
  })
  .then(function(){
    var address = new Address({
      address: req.body.address,
      deleted: false
    });
    Address.findOne({address: req.body.address}, function(err, findAddress){
      if(err){
        res.send(err);
      }else{
        console.log("Addresse trouvé");
        console.log(findAddress);
        if(findAddress != null){
          users.address.push(findAddress);
          findAddress.user.push(users._id);
          var userAddress = findAddress.user;
          Address.update({_id: findAddress._id},{user: userAddress},function(err, address){
            if(err){
              res.send(err);
            }
          });
        }else{
          address.user = users;
          address.save(function(err){
          });
          users.address = address;
        }
      }
    }).then(function(){
      users.save(function(err){
        if(err){
          res.send(err);
        }
        else{
          res.send("All is okay");
        }
      });
    });
  });
});
// deleted to true
router.delete('/softdelete', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      User.findById({_id: req.body.id}, function(err, user){
        user.deleted = true;
        user.save(function(err){
          if(err){
            res.send(err);
          }else{
            res.send("Soft delete performed");
          }
        });
      });
    }else{
      res.json('user doesnt exist');
    }
  });
});
// Hard delete ( check all the others to delete all references)
router.delete('/delete', function(req,res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      User.findById(req.body.id, function(err, user){
        User.remove({_id: req.body.id}, function(err){
          if(err){
            res.send(err);
          }else{
            res.send("Hard delete performed");
          }
        });
        user.group.forEach(function(groupId){
          Group.findById(groupId, function(err, group){
            var i =0;
            var userInGroup = group.user;
            group.user.forEach(function(userId){
              if(userId == user._id.toString()){
                userInGroup.splice(i, 1);
              }
              i++;
            });
            group.user = userInGroup;
            group.save(function(err){
              if(err){
                res.send(err);
              }
            });
          });
        });
        
        user.address.forEach(function(addressId){
          Address.findById(addressId, function(err, address){
            var i =0;
            var userInAddress = address.user;
            address.user.forEach(function(userId){
              if(userId == user._id.toString()){
                userInAddress.splice(i, 1);
              }
              i++;
            });
            address.user = userInAddress;
            console.log("address");
            console.log(address.user);
            address.save(function(err){
              if(err){
                res.send(err);
              }
            });
          });
        });
      });
      
    }else{
      res.json('user doesnt exist');
    }
  });
  
});
// list all user
// list all user
router.get('/list', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      User.find({deleted: false},function(err, users){
        res.json(users);
      })
      .populate({ path: 'address', select: 'address', match: {deleted : false}})
      .populate({ path: 'group', select: 'title', match: {deleted : false} })
      .exec();
    }
    else{
      res.json('user doesn\'t exist');
    }
    
  });
});
router.get('/list/limit', function(req,res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      var query = User.find({});
      var limit = req.query.limit != undefined ? Number(req.query.limit) : 10;
      query.limit(limit);
      
      query.populate({ path: 'address', select: 'address', match: {deleted : false}})
      query.populate({ path: 'group', select: 'title', match: {deleted : false} })
      query.exec(function(err, docs){
        res.json(docs);
      });
    }else{
      res.json("this user doesn\'t exist");
    }
  });
  
});
router.put('/update', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    User.update({_id: req.body.id},{nom : req.body.nom, prenom: req.body.prenom, tel: req.body.tel}, function(err){
      if(err){
        res.json(err);
      }else{
        res.send('Updated');
      }
    });
  });
  
});


router.put('/user/changepassword/', function(req, res){
  var token = req.get('token');
  var hash = crypto.createHash('md5');
  hash.update(req.body.login+"."+req.body.password);
  if(hash.digest('hex') == token){
    User.findOne({login: req.body.login, deleted: false}, function(err, user){
      if(err){
        res.send(err);
      }
      else{
        if(req.body.newpassword == req.body.confirmpassword){
          User.updateOne({_id: user._id},{password: req.body.newpassword}, function(err){
            if(err){
              res.json(err);
            }else{
              res.send('Password Updated');
            }
          });
        }
        else{
          res.send('passwords must match');
        }
      }
    });
  }
  else
  {
    res.send('Action unauthaurized');
  }
});

router.put('/user/changelogin/', function(req, res){
  var token = req.get('token');
  var hash = crypto.createHash('md5');
  hash.update(req.body.login+"."+req.body.password);
  if(hash.digest('hex') == token){
    User.findOne({login: req.body.login, deleted: false}, function(err, user){
      if(err){
        res.send(err);
      }
      else{
        if(req.body.newlogin == req.body.confirmlogin){
          User.updateOne({_id: user._id},{login: req.body.newlogin}, function(err){
            if(err){
              res.json(err);
            }else{
              res.send('Login Updated');
            }
          });
        }
        else{
          res.send('Logins must match');
        }
      }
    });
  }
  else
  {
    res.send('Action unauthaurized');
  }
});

module.exports = router;
