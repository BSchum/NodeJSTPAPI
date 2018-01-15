var Address = require('../../model/address.js');
var User = require('../../model/user.js');
var Group = require('../../model/group.js');
var helpers = require('../helpers.js');
const router = require('express').Router();


// GROUP CRUD
//register a user to a group
router.post('/register', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Group.findOne({title: req.body.title, deleted: false}, function(err, group){
        if(err){
          res.send(err);
        }
        else{
          User.findOne({_id: req.body.id}, function(err, user){
            if(err){
              res.send(err);
            }
            
            Group.update({_id: group._id}, {$push: {user: user._id}, deleted: false}, function(err, group){
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
// create a group
router.post('/create', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      var group = new Group({
        title: req.body.title,
        description: req.body.description,
        deleted: false
      });
      group.save(function(err){
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
// list all group
router.get('/list', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Group.find({deleted: false}, function(err, groups){
        res.json(groups);
      });
    }else{
      res.json('user doesnt exist');
    }
  });
});
// list 10 or the limit passed in params : /group/list/limit?limit=5
router.get('/list/limit', function(req,res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    console.log(hashOk);
    if(hashOk){
      var query = Group.find({});
      var limit = req.query.limit != undefined ? Number(req.query.limit) : 10;
      query.limit(limit);
      query.exec(function(err, docs){
        res.json(docs);
      });
      console.log("Exists");
      
    }else{
      console.log("dont Exists");
      res.json('user doesnt exist');
    }
  });
});
//delete a group TODO
router.delete('/delete', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Group.findOne({_id: req.body.id}, function(err, groupFinded){
        if(err){
          res.send(err);
        }else{
          Group.remove({_id: req.body.id}, function(err){
            if(err){
              console.log(err);
            }else{
              res.send("Hard delete performed");
            }
          });
          groupFinded.user.forEach(function(userInGroup){
            User.findOne({_id: userInGroup},function(err, users){
              var i = 0;
              var arrayOfGroup = users.group;
              users.group.forEach(function(groupInUserId){
                if(groupInUserId == groupFinded._id.toString()){
                  arrayOfGroup.splice(i , 1);
                }
                i++;
              });
              users.group = arrayOfGroup;
              
              users.save(function(err){
                if(err){
                  console.log(err);
                }
              });
            });
          });
        }
      });
    }
  });
  
});
// soft delete a group ( deleted to true)
router.delete('/softdelete', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Group.findById({_id: req.body.id}, function(err, group){
        group.deleted = true;
        group.save(function(err){
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
// Apdate a group
router.put('/update', function(req, res){
  var token = req.get('token');
  helpers.compareHash(token, function(hashOk){
    if(hashOk){
      Group.update({_id: req.body.id},{title : req.body.title, description: req.body.description}, function(err){
        if(err){
          res.json(err);
        }else{
          res.send('Group Updated successfully');
        }
      });
    }
  });
  
});


module.exports = router;
