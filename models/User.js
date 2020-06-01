const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    familyName: {type: String,required: true},
    givenName: {type: String,required: true}
  },
  email: {type: String,required: true},
  picture: {type: String,required: false},
  password: {type: String,required: false},
  accountState:{
    dateOfCreation: {type: Date,default: Date.now}
  },
  biddingStates:{
    outdone:{type: Number , default: 0},
    winner:{type: Boolean , default: false}
  },
  offerStates: {
    newBid:{type: Number , default:0}
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;