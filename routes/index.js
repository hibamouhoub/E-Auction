const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated, forwardAuthenticated } = require('../configurations/authentication');

//User and offer models
const User = require('../models/User');
const Offer = require('../models/offer');
const Rate = require('../models/Rate');
const Bid = require('../models/Bid');

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
router.get('/dashboard', ensureAuthenticated, async(req, res) =>{
  var offerMap = [];
  await Offer.find({'informations.ownerId':{$ne:req.user._id}} )
  .then(offers =>{
    offers.forEach(offer=>{
      offerMap.push(offer);
    })
  });
  res.render('dashboard', {
    user: req.user,
    offers: offerMap
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
    Rate.findOne({userId: req.user._id, offerId: req.query.id})
    .then(newrate =>{
      if(newrate){
        res.render('offer',{
          rate: newrate.rate,
          user: req.user,
          offerId: offer
        });
      } else {
        res.render('offer',{
          rate: 0,
          user: req.user,
          offerId: offer
        });
      }
    })
    .catch(err => console.log(err));
  })
  .catch(err => console.log(err));
});


//goback from offer page to dashboard
router.get('/goback',(req,res)=>{
    User.findOne({_id: req.query.id})
  .then(user =>{
    res.redirect('/dashboard');
  })
  });

//the rate 
router.post('/rate', (req,res)=>{
  const offerid = req.body.offerid;
  const customRange1 = req.body.customRange1;
  Rate.findOne({userId: req.user._id, offerId: offerid})
  .then(newrate =>{
    if(!newrate){
      const newRate = new Rate({
        userId: req.user._id,
        offerId: offerid,
        rate: customRange1
      });
      newRate.save()
      .then(rate =>{
        Offer.findOne({_id:offerid })
          .then(offer =>{
            Rate.find({offerId: offer._id})
            .then(rates =>{
              var totalRate = 0.0;
              var i = 0;
              rates.forEach((rateuh)=>{
              totalRate= totalRate + rateuh.rate;
              i= i+1;
              });
              offer.rating = Math.round(totalRate/i + "e+1")  + "e-1";
              offer.save();
            });
              req.flash(
                'success_msg',
                'Your rate was saved in the database'
              );
              res.redirect('/offer?id='+offerid);
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
    } else {
      newrate.rate = customRange1;
      newrate.save()
      .then(user => {
         Offer.findOne({_id:offerid })
          .then(offer =>{
              Rate.find({offerId: offer._id})
              .then(rates =>{
                var totalRate = 0.0;
                var i = 0;
                rates.forEach((rateuh)=>{
                  totalRate= totalRate + rateuh.rate;
                  i= i+1;
                });
                offer.rating = Math.round(totalRate/i + "e+1")  + "e-1";
                //console.log(offer.rating);
                offer.save();
              });
               req.flash(
                 'success_msg',
                 'Your rate was saved in the database'
               );
               res.redirect('/offer?id='+offerid);
          })
        })
        .catch(err => console.log(err));
    }
  })
  .catch(err => console.log(err));
});

//the bid
router.post('/bid',(req,res)=>{
  const offerId = req.body.offerid2;
  const theBid = req.body.theBid;
  const userId = req.user._id;
  User.findOne({_id:userId})
  .then(useer=>{
    if (useer.biddingStates.outdone>0){
      useer.biddingStates.outdone--;
    }
    useer.save();
  });
  const newBid = new Bid({
    userId,
    offerId,
    theBid
  });
  newBid.save()
  .then(bid =>{
      Offer.findOne({_id:offerId})
      .then(offer=>{
        User.findOne({_id:offer.informations.ownerId})
        .then(userr=>{
          userr.offerStates.newBid = userr.offerStates.newBid + 1;
          userr.save();
        });
        offer.pricing.price = theBid;
        User.findOne({_id:offer.pricing.currentBidderId})
        .then(useer=>{
            useer.biddingStates.outdone = useer.biddingStates.outdone + 1;
            useer.save();
        });
        offer.pricing.currentBidderId = userId;
        offer.save();
        req.flash(
          'success_msg',
          'Your bid was saved in the database'
        );
        res.redirect('/offer?id='+offerId);
      })
      .catch(err => console.log(err));
  })
  .catch(err => console.log(err));
});


//current offers
router.get('/currentOffers', async(req,res)=>{
  var offerMap = [];
  await Offer.find({'informations.ownerId':req.user._id} )
  .then(offers =>{
    offers.forEach(offer=>{
      offerMap.push(offer);
    })
  });
  res.render('currentOffers', {
    user: req.user,
    offers: offerMap
  });
});

//offer's bid history
router.get('/bidsHistory',async(req,res)=>{
  var bidMap = [];
  var rateMap = [];
  await Bid.find({'offerId':req.query.id}).sort({'date':-1})
  .then(async bids =>{
    for(bid of bids){
      var complet = [];
      await User.findById(bid.userId)
      .then(user=>{
        complet.push(user);
      });
      complet.push(bid);
      bidMap.push(complet);
    }
    // bids.forEach(async bid=>{
    //   var complet = [];
    //   User.findById(bid.userId)
    //   .then(user=>{
    //     complet.push(user);
    //   });
    //   complet.push(bid);
    //   bidMap.push(complet);
    // })
  });
  await Rate.find({'offerId':req.query.id}).sort({'date':-1})
  .then(async rates =>{
    for(rate of rates){
      var complet = [];
      await User.findById(rate.userId)
      .then(user=>{
        complet.push(user);
      });
      complet.push(rate);
      rateMap.push(complet);
    }
    // rates.forEach(async rate=>{
    //   var complet = [];
    //   User.findById(rate.userId)
    //   .then(user=>{
    //     complet.push(user);
    //   });
    //   complet.push(rate);
    //   rateMap.push(complet);
    // })
  });
  console.log(rateMap);
  res.render('bidRateHistory', {
    user: req.user,
    rates: rateMap,
    bids: bidMap
  });
  
});


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