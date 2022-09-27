const express = require('express');
const passport = require('passport');
const Account = require('../models/account');
const router = express.Router();
const auth = require("../middleware/auth")


router.get('/', auth.ensureAuthenticated, function (req, res) {
  res.render('index', { user : req.user });
});

router.get('/register', auth.ensureAuthenticated, function(req, res) {
  res.render('register', { });
});

router.post('/register', auth.ensureAuthenticated, function(req, res, next) {
  Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { error : err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});


router.get('/login', auth.ensureAuthenticated, function(req, res) {
  res.render('login', { user : req.user });
});

router.post('/login', auth.ensureAuthenticated, passport.authenticate('local'), function(req, res) {
  res.redirect('/');
});

router.get('/logout', auth.ensureAuthenticated, function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/ping', auth.ensureAuthenticated, function(req, res){
    res.status(200).send("pong!");
});

module.exports = router;
