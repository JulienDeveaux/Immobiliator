const express = require('express');
const passport = require('passport');
const Account = require('../models/account');
const router = express.Router();

router.get('/', function (req, res) {
  let role = req.app.get('role')
  res.render('index', { user : req.user , role : role});
});

router.get('/register', function(req, res) {
  res.render('register', { });
});

router.post('/register', function(req, res, next) {
  Account.register(new Account({ username : req.body.username , type : (req.body.type === 'true')}), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { error : err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        let role = req.app.get('role');
        if(role === null && req.user !== undefined)
          role = Account.find({username: req.user}).get("type");
        if(role) {
          role = "Utilisateur";
          req.app.set('role', role);
        } else {
          role = "Agent immobilier";
          req.app.set('role', role);
        }
        if(req.user !== undefined) {
          req.app.set('user', req.user.username);
        }
        res.redirect('/');
      });
    });
  });
});


router.get('/login', function(req, res) {
  res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  let role = req.app.get('role');
  if(role === null && req.user !== undefined)
    role = Account.find({username: req.user}).get("type");
  if(role) {
    role = "Utilisateur";
    req.app.set('role', role);
  } else {
    role = "Agent immobilier";
    req.app.set('role', role);
  }
  if(req.user !== undefined) {
    req.app.set('user', req.user.username);
  }
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
  req.app.set('role', null);
  req.app.set('user', null);
});

router.get('/modifyUser', function(req, res) {
  res.render('modifyUser', {username : req.app.get("user"), role : req.app.get("role")})
})

router.post('/modifyUser', function(req, res) {
  Account.find({username : req.app.get('user')}).remove().exec();
  Account.register(new Account({ username : req.body.username , type : (req.body.type === 'true')}), req.body.password, function(err, account) {
    if (err) {
      return res.render('modifyUser', { error : err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        let role = req.app.get('role');
        if(role === null && req.user !== undefined)
          role = Account.find({username: req.user}).get("type");
        if(role) {
          role = "Utilisateur";
          req.app.set('role', role);
        } else {
          role = "Agent immobilier";
          req.app.set('role', role);
        }
        if(req.user !== undefined) {
          req.app.set('user', req.user.username);
        }
        res.redirect('/');
      });
    });
  });
})

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

module.exports = router;
