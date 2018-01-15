const mongoose = require('mongoose');
var address = mongoose.Schema({
  address: {
    type: String,
    index: {
      unique: true
    }
  },
  user: [{type:mongoose.Schema.Types.ObjectId, ref: 'User'}],
  deleted: Boolean
});
module.exports = mongoose.model('Address', address);
