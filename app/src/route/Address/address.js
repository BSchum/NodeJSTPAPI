var Address = require('../../model/address.js');
var User = require('../../model/user.js');
var Group = require('../../model/group.js');
var helpers = require('../helpers.js');
const router = require('express').Router();

// ADRESSES CRUD
//register a user to a address
router.post('/address/register', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      Address.findOne({address: req.body.address}, function(err, group){
        if(err){
          res.send(err);
        }
        else{
          User.findOne({_id: req.body.id}, function(err, user){
            if(err){
              res.send(err);
            }
            
            Address.update({_id: group._id}, {$push: {user: user._id}, deleted: false}, function(err, group){
              if(err){
                res.send(err);
              }else{
                res.send("registered");
              }
            });
          });
        }
      })
    }else{
      res.json('user doesnt exist');
    }
  });
  
});
// create an address
router.post('/address/create', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      var address = new Address({
        address: req.body.address,
        deleted: false
      });
      address.save(function(err){
        if(err){
          res.json(err);
        }else{
          res.json('registered');
        }
      });
    }else{
      res.json('user doesnt exist');
    }
  });
});
// list all address
router.get('/address/list', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Address.find({deleted: false}, function(err, addresses){
        res.json(addresses);
      })
      .populate({ path: 'user', select: 'login nom prenom', match: {deleted : false} })
      .exec();
    }else{
      res.json('address doesn\'t exist');
    }
  });
});
// list 10 or the limit passed in params : /address/list/limit?limit=5
router.get('/address/list/limit', function(req,res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    console.log(hashOk);
    if(hashOk){
      var query = Address.find({});
      var limit = req.query.limit != undefined ? Number(req.query.limit) : 10;
      query.limit(limit);
      query.populate({ path: 'user', select: 'login nom prenom', match: {deleted : false} })
      query.exec(function(err, docs){
        res.json(docs);
      });
      
    }else{
      res.json('group doesn\'t exist');
    }
  });
});
//delete an address TODO
router.delete('/address/delete', function(req, res){
  Address.findOne({_id: req.body.id}, function(err, addressToDelete){
    if(err){
      res.send(err);
    }else{
      Address.remove({_id: req.body.id}, function(err){
        if(err){
          console.log(err);
        }else{
          res.send("Address hard deleted");
        }
      });
      addressToDelete.user.forEach(function(userInAddress){
        Address.findOne({_id: userInAddress},function(err, users){
          var i = 0;
          var arrayOfAddress = addresses.group;
          addresses.group.forEach(function(addressInUserId){
            if(addressInUserId == addressToDelete._id.toString()){
              arrayOfAddress.splice(i , 1);
            }
            i++;
            users.address = arrayOfAddress;
          });
          users.save(function(err){
            if(err){
              console.log(err);
            }
          });
        });
      });
    }
  });
});
// soft delete an address ( deleted to true)
router.delete('/address/softdelete', function(req, res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
    if(hashOk){
      Address.findById({_id: req.body.id}, function(err, address){
        address.deleted = true;
        address.save(function(err){
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
// update a address
router.put('/address/update', function(req, res){
  Address.update({_id: req.body.id},{address : req.body.address}, function(err){
    if(err){
      res.json(err);
    }else{
      res.send('Address Updated successfully');
    }
  });
});

module.exports = router;
