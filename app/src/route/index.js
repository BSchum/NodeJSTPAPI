const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();
var bodyParser = require('body-parser');
var mongoDB = 'mongodb://127.0.0.1/ProjectDB';


mongoose.Promise = global.Promise;

var Adress = require('../model/adress.js');
var User = require('../model/user.js');
var Group = require('../model/group.js');

// CETTE FONCTION PERMETS DE VERIFIER LE TOKEN DANS LE HEADER DE TA REQUETE
// IL FAUT DONC AJOUTER DANS LE HEADER : token: ET LE TOKEN QUE TU AS EU EN TE CONNECTANT VIA LA ROUTE AUTH EN PASSANT
// LES PARAMETRES LOGIN ET MDP
function compareHash(hashtest, callback){
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
// TODO route pour modifier le user authentifier:
/* Faut recuperer le token du header : req.get('token'),
chercher dans les user quel user a un hash qui est similaire (compareHash fait ca donc tu peux t'en inspirer),
et modifier le user avec les données envoyer si le user existe */

mongoose.connect(mongoDB, {
  useMongoClient: true
});

app.use(bodyParser.json());
app.post('/auth',function(req,res){
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

// USER CRUD
//TODO HASH PASSWORD BEFORE REGISTER TO BDD
// create a user, with an adress and a group ( register to the group/adress if already exist, create them if dont)
app.post('/user/register', function(req, res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
    if(hashOk){
      var users = new User({
        nom: req.body.nom,
        prenom: req.body.prenom,
        tel: req.body.tel,
        login: req.body.login,
        password: req.body.password,
        group: [],
        adress: [],
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
        var adress = new Adress({
          adress: req.body.adress,
          deleted: false
        });
        Adress.findOne({adress: req.body.adress}, function(err, findAdress){
          if(err){
            res.send(err);
          }else{
            console.log("Adresse trouvé");
            console.log(findAdress);
            if(findAdress != null){
              users.adress.push(findAdress);
              findAdress.user.push(users._id);
              var userAdress = findAdress.user;
              Adress.update({_id: findAdress._id},{user: userAdress},function(err, adress){
                if(err){
                  res.send(err);
                }
              });
            }else{
              adress.user = users;
              adress.save(function(err){
              });
              users.adress = adress;
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
    }else{
      res.json('user doesnt exist');
    }
  });
  
});
// deleted to true
app.delete('/user/softdelete', function(req, res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
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
app.delete('/user/delete', function(req,res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
    if(hashOk){
      User.findById(req.body.id, function(err, user){
        user.group.forEach(function(groupId){
          Group.findById(groupId, function(err, group){
            var i =0;
            group.user.forEach(function(userId){
              if(userId == user._id){
                object.splice(i, 1);
              }
              i++;
            });
          });
        });
        
        user.adress.forEach(function(adressId){
          Adress.findById(adressId, function(err, adress){
            var i =0;
            adress.user.forEach(function(userId){
              if(userId == user._id){
                object.splice(i, 1);
              }
              i++;
            });
          });
        });
      });
      User.remove({_id: req.body.id}, function(err){
        if(err){
          res.send(err);
        }else{
          res.send("Hard delete performed");
        }
      });
    }else{
      res.json('user doesnt exist');
    }
  });
  
});
// list all user
app.get('/user/list', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      User.find({deleted: false},function(err, users){
        res.json(users);
      });
    }
    else{
      res.json('user doesnt exist');
    }
    
  });
});
// list X user ( 10 by default or the params in url ex :/group/list/limit?limit=5 )
app.get('/user/list/limit', function(req,res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      var query = User.find({});
      var limit = req.query.limit != undefined ? Number(req.query.limit) : 10;
      query.limit(limit);
      query.exec(function(err, docs){
        res.json(docs);
      });
    }else{
      res.json("this user doesnt exist");
    }
  });
  
})
app.put('/user/update', function(req, res){
  User.update({_id: req.body.id},{nom : req.body.nom, prenom: req.body.prenom, tel: req.body.tel}, function(err){
    if(err){
      res.json(err);
    }else{
      res.send('Updated');
    }
  });
});


// GROUP CRUD
//register a user to a group
app.post('/group/register', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
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
app.post('/group/create', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
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
app.get('/group/list', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
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
app.get('/group/list/limit', function(req,res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
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
app.get('/group/delete', function(req, res){
});
// soft delete a group ( deleted to true)
app.delete('/group/softdelete', function(req, res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
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

// ADRESSES CRUD
//register a user to a adress
app.post('/adress/register', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      Adress.findOne({adress: req.body.adress}, function(err, group){
        if(err){
          res.send(err);
        }
        else{
          User.findOne({_id: req.body.id}, function(err, user){
            if(err){
              res.send(err);
            }
            
            Adress.update({_id: group._id}, {$push: {user: user._id}, deleted: false}, function(err, group){
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
// create an adress
app.post('/adress/create', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      var adress = new Adress({
        adress: req.body.adress,
        deleted: false
      });
      adress.save(function(err){
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
// list all adress
app.get('/adress/list', function(req, res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    if(hashOk){
      Adress.find({deleted: false}, function(err, adresses){
        res.json(adresses);
      });
    }else{
      res.json('user doesnt exist');
    }
  });
});
// list 10 or the limit passed in params : /adress/list/limit?limit=5
app.get('/group/list/limit', function(req,res){
  var token = req.get('token');
  compareHash(token, function(hashOk){
    console.log(hashOk);
    if(hashOk){
      var query = Adress.find({});
      var limit = req.query.limit != undefined ? Number(req.query.limit) : 10;
      query.limit(limit);
      query.exec(function(err, docs){
        res.json(docs);
      });
      
    }else{
      res.json('user doesnt exist');
    }
  });
});
//delete an adress TODO
app.get('/adress/delete', function(req, res){
});
// soft delete an adress ( deleted to true)
app.delete('/adress/softdelete', function(req, res){
  var token = req.get('token');
  compareHash(token, res, function(hashOk){
    if(hashOk){
      Adress.findById({_id: req.body.id}, function(err, adress){
        adress.deleted = true;
        adress.save(function(err){
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

app.listen(1000, function () {
  console.log("Server On");
});
