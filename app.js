const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const auth = require("./middleware/auth")
const LocalStrategy = require('passport-local').Strategy;
const Uuid = require('uuid');
const GraphQL = require('express-graphql');
const Oauth = require('passport-oauth2').Strategy;


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const announcesRouter = require('./routes/announces');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileupload());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '/public')));

app.all("*", async function(req, res, next)
{
  try
  {
    if(req.cookies.token && Uuid.parse(req.cookies.token))
    {
      const user = await Account.where({token: req.cookies.token}).findOne()

      if(user)
      {
        req.user = user;
      }
    }
  }
  catch (e)
  {

  }

  next();
});

app.all('*', auth.ensureAuthenticated);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/announces', announcesRouter);

app.use('/graphql', GraphQL.graphqlHTTP({
  schema: require('./graphql/index'),
  graphiql: app.get('env') === 'development'
}))

// passport config
const Account = require('./models/account');
passport.use("local", new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

passport.use("oauth", new Oauth({
  authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
  tokenURL: 'https://oauth2.googleapis.com/token',
  clientID: '562698289154-j55jdbaduc698q6l8laan09qp15ud4hr.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "http://localhost:3000/users/oauth/callback",
  response_type: "code",
  scope: "web"
}, function(accessToken, refreshToken, profile, cb)
{
  console.log(profile);
}));

// mongoose
let db = undefined;

mongoose.connect(`mongodb://localhost:27017/${app.get('env') === 'test' ? 'testImmo' : 'immobiliator'}`)
    .then(databaseCon =>
    {
        db = databaseCon;
    });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.disconnectDb = () => db ? db.disconnect() : undefined;

module.exports = app;
