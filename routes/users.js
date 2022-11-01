const express = require('express');
const Account = require("../models/account");
const passport = require("passport");
const Uuid = require("uuid");
const router = express.Router();

router.get('/modifyUser', function(req, res) {
  res.render('users/modifyUser', {username : req.user.username, role : req.user.type, user: req.user})
})

router.post('/modifyUser', async function(req, res) {
  Account.findOne({username : req.user.username}, (err, account) =>
  {
    if(req.body.username && req.body.username.length > 1 && req.body.username !== account.username)
      account.username = req.body.username;

    if(req.user.type.toString() !== req.body.type)
      account.type = req.body.type;

    if(req.body.password && req.body.oldPassword)
    {
      account.changePassword(req.body.oldPassword, req.body.password, function(err)
      {
        if(err)
        {
          return res.render('users/modifyUser', {user: req.user, error : err.message });
        }

        passport.authenticate('local')(req, res, function ()
        {
          req.session.save(function (err)
          {
            if (err)
            {
              return res.render('users/modifyUser', {user: req.user, error : err.message });
            }

            res.render('users/modifyUser', { user: account, success: true });
          });
        });
      });
    }
    else
    {
      account.save();

      res.render('users/modifyUser', { user: account, success: true });
    }
  });
});

router.get('/logout', function(req, res) {
  req.user.token = "";
  req.user.save();

  req.logout(() =>
  {
    res.clearCookie("token");

    res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  res.render('users/login', { user : req.user });
});

router.post('/login',
    function(req, res, next) {
      passport.authenticate('local', {}, (r, user, message) => {

        if(message)
        {
          res.render("users/login", {error: message.message});
        }
        else
        {
          user.token = Uuid.v4();

          res.cookie("token", user.token);

          user.save();

          next();
        }
      })(req, res);
    },
    function(req, res) {

      res.redirect('/');
    }
);

router.get('/register', function(req, res) {
  res.render('users/register', { });
});

router.post('/register', function(req, res, next) {
  const token = Uuid.v4();
  Account.register(new Account({ username : req.body.username, token: token, type : (req.body.type === 'true')}), req.body.password, function(err, account) {
    if (err) {
      return res.render('users/register', { error : err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }

        res.cookie("token", token);
        res.redirect('/');
      });
    });
  });
});

router.get('/oauth', passport.authenticate('oauth', {scope: [ 'email', 'profile' ]}));

router.get('/oauth/callback',
    passport.authenticate('oauth', {failureRedirect: '/login'}),
    function(req, res)
    {
      res.redirect('/');
    });

module.exports = router;
