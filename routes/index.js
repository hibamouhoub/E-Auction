const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated, forwardAuthenticated } = require('../configurations/authentication');

//User and offer models
const User = require('../models/User');
const Offer = require('../models/offer');

//configuring multer
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'images');
    },
    filename: function(req, file, cb) {
      cb(null, req.user._id+file.originalname);
    }
});
const upload = multer({
    storage: storage
});


//welcome page
router.get('/',(req,res) => {
  res.render('Welcome');
});

//password page
router.get('/password',(req,res) => res.render('password', {
  user: req.user
}));
router.post('/password', (req, res) => {
  var {password, password2} = req.body;
  let errors = [];

  if (!password || !password2) {errors.push({ msg: 'Please enter all fields' });}

  if(password != password2){errors.push({msg: 'Passwords do not match'});}

  if (password.length < 6) {errors.push({ msg: 'Password must be at least 6 characters' });}

  if (errors.length >0){
      res.render('password', {
          errors,
          password,
          password2
      });
  } else {
      //validation passed
      User.findOne({_id: req.user._id})
      .then(user =>{
          if(user){
              bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(password, salt, (err, hash) => {
                    if (err) throw err;
                    password = hash;
                    user.password = password;
                    user.save()
                      .then(user => {
                          req.flash(
                              'success_msg',
                              'Your password was saved to the database'
                            );
                          res.redirect('/dashboard');
                      })
                      .catch(err => console.log(err));
                  });
                });
          }
      })
  }

});


//dashboard page
router.get('/dashboard', ensureAuthenticated, (req, res) =>{
  Offer.find({'informations.ownerId':{$ne:req.user._id}} )
  .then(offers =>{
    res.render('dashboard', {
      user: req.user,
      offers: offers
    });
  });
  
    
});

//adding offers to the database
router.get('/newOffer',(req,res) => res.render('newOffer'));  
router.post('/newOffer',upload.single('picturez'), (req,res)=>{
    const{name, subname, categories, description, price, deadline} = req.body;
    const pictureName = `${req.file.filename}`;
    let errors = [];
    if (!name || !subname || !categories || !description || !price || !deadline) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (errors.length >0){
        res.render('newOffer', {
            errors,name, subname, categories, description, price,deadline
        });
    } else {
        const newOffer = new Offer ({
            name,
            informations:{
              ownerId:req.user._id,
              subname: subname,
              picture: pictureName,
              categories: categories,
              description: description,
              deadline: deadline
            },
            pricing:{
              initialPrice: price,
              price:price  
            }
        });
        newOffer.save()
        .then(offer =>{
            req.flash(
                'success_msg',
                'The offer was successfuly added to the database'
            );
            res.redirect('/dashboard');
        })
    }

});

//checking offer
router.get('/offer', (req,res)=>{
  Offer.findById(req.query.id)
  .then(offer =>{
        res.render('offer',{
          user: req.user,
          offerId: offer,
          rate:0
        });
  })
  .catch(err => console.log(err));
});


//goback from offer page to dashboard
router.get('/goback',(req,res)=>{
  User.findOne({_id: req.query.id})
.then(user =>{
  res.redirect('/dashboard');
})
})

  



//google authentication page and callback page
router.get('/auth/google',
passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/auth/google/callback', 
passport.authenticate('google'),(req, res)=> {
  User.findOne({email: req.user.email})
  .then(user =>{
      if(user.password){
        res.redirect('/dashboard');
      } else {
        res.redirect('/password');
      }
  })
  .catch(err => console.log(err)); 
});



module.exports = router;