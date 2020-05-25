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
                        name: { familyName:profile.name.familyName,givenName: profile.name.givenName },
                        picture:profile.photos[0].value,
                        accountState:{verified: true}  
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
