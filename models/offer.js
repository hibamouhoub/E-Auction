const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {type: String,required: true},
  informations:{
    ownerId: {type: String, required: true},
    subname: {type: String,required: true},
    categories:{type: String,required: true},
    description:{type: String,required: true},
    picture: {type: String,required: false},
    deadline: {type: Date,required: false}
  },
  pricing:{
    initialPrice: {type: Number,required: true},
    price: {type: Number,required: true},
    currentBidderId:{type: String,required: false},
    winnerId:{type: String,required: false}
  },
  rating:{type: Number,required: false},
  done:{type: Boolean, default:false}
});

const Offer = mongoose.model('Offer', UserSchema);

module.exports = Offer;