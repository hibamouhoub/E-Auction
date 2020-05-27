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
  rate: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Rate = mongoose.model('Rate', UserSchema);

module.exports = Rate;