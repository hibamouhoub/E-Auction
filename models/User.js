const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  familyName: {
    type: String,
    required: true
  },
  givenName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  outdone:{
    type: Boolean,
    default: false
  },
  winner:{
    type: Boolean,
    default: false
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;