const express = require('express');
const app = express();
const expressLayouts = require ('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//images static
app.use('/images', express.static('images'));

// Passport Config
require('./configurations/passport')(passport);

//body parser
app.use(express.urlencoded({extended: false}));



//Express session
app.use(
    session({
      secret: 'secreto',
      resave: true,
      saveUninitialized: true
    })
  );

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// flash
app.use(flash());

//global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });


//DB config
const db = require('./configurations/keys').MongoURI;

//connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true })
.then(()=> console.log('MongoDB connected successfully'))
.catch((err) => console.log(err));


//routes 
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));


const PORT = process.env.PORT || 1000;
app.listen(PORT, console.log(`Server started on port: ${PORT}`));
