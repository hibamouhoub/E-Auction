const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const clientid = require('./keys').GoogleClientID;
const clientsecret = require('./keys').GoogleClientSecret;

//load user model
const User = require('../models/User');
module.exports = function(passport){
    passport.use(
        new LocalStrategy({ usernameField: 'email'}, (email,password,done)=>{
            //match user
            User.findOne({email: email})
            .then(user =>{
                if(!user){
                    return done(null, false, {message: 'The email is not registered'});
                }

                //Match password
                bcrypt.compare(password, user.password, (err, isMatch)=>{
                    if(err) throw err;
                    if(isMatch){
                        return done(null, user);
                    } else {
                        return done(null, false, {message: 'Password incorrect'});
                    }
                });
            })
            .catch(err => console.log(err));
        })
    );


    passport.use(
        new GoogleStrategy({
            clientID: clientid,
            clientSecret: clientsecret,
            callbackURL: "/auth/google/callback"
        },
        (accessToken, refreshToken, profile, done)=> {
            //console.log("profile",profile);
            User.findOne({email: profile.emails[0].value})
            .then(user =>{
                if(user){
                    return done(null, user);
                } else {
                    new User({ 
                        email: profile.emails[0].value,
                        familyName:profile.name.familyName,
                        givenName: profile.name.givenName,
                        picture:profile.photos[0].value  
                    }).save().then((newUser)=>{
                        //console.log('New user created: \n',newUser);
                        return done(null, newUser);
                    });
                }
            })
            .catch(err => console.log(err));     
        }
    ));

    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
}
