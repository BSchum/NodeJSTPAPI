const mongoose = require('mongoose');
group = require('./group.js');
var user = mongoose.Schema({
  nom: String,
  prenom:String,
  tel: String,
  login: {
    type: String,
    index: {
      unique: true
    }
  },
  password: {
    type: String,
  },
  group: [{type:mongoose.Schema.Types.ObjectId, ref: 'Group',  default: []}],
  address: [{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    default: []}],
    deleted: Boolean
  });
  module.exports = mongoose.model('User', user);
