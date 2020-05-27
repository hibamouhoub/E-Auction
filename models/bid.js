const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  offerId: {
    type: String,
    required: true
  },
  theBid: {
    type: Number,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Bid = mongoose.model('Bid', UserSchema);

module.exports = Bid;