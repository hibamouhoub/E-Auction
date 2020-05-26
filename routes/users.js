const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');




//login page
router.get('/login',(req,res) => res.render('Login'));

//Register page
router.get('/register',(req,res) => res.render('Register'));
router.post('/register', (req, res) => {
    const {givenName, familyName, email, password, password2} = req.body;
    let errors = [];

    // check required fields
    if (!familyName || !givenName || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    // check passwords matching
    if(password != password2){
        errors.push({msg: 'Passwords do not match'});
    }

    // check password's lenght
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length >0){
        res.render('register', {
            errors,
            familyName,
            givenName,
            email,
            password,
            password2
        });
    } else {
        //validation passed
        User.findOne({email: email})
        .then(user =>{
            if(user){
                //user exists
                errors.push({ msg: 'Email is already registered' });
                res.render('register', {
                    errors,
                    familyName,
                    givenName,
                    email,
                    password,
                    password2
                });
            } else {

                //saving the new user
                const newUser = new User ({
                    name: {familyName,givenName},
                    email,
                    password,
                    picture: 'https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png'
                });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                      if (err) throw err;
                      newUser.password = hash;
                      newUser.save()
                        .then(user => {
                            req.flash(
                                'success_msg',
                                'We sent a link to your email address. Check it to activate your account !'
                              );
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                    });
                  });
                //console.log(newUser);
            }
        })
    }

});


// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next);
});
  
// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

module.exports =router;