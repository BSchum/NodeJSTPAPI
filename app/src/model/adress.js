const mongoose = require('mongoose');
var adress = mongoose.Schema({
  adress: {
    type: String,
    index: {
      unique: true
    }
  },
  user: [{type:mongoose.Schema.Types.ObjectId, ref: 'User'}],
  deleted: Boolean
});
module.exports = mongoose.model('Adress', adress);
