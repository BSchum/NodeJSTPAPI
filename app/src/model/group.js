const mongoose = require('mongoose');
user = require('./user.js');
var group = mongoose.Schema({
  title : {
    type: String,
    index: {
      unique: true
    }
  },
  description: String,
  user: [{type:mongoose.Schema.Types.ObjectId, ref: 'User'}],
  deleted: Boolean
});
module.exports = mongoose.model('Group', group);
