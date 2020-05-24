const express = require('express');
const router = express.Router();


//login page
router.get('/login',(req,res) => res.render('Login'));

  
  // Logout
  router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });

module.exports =router;