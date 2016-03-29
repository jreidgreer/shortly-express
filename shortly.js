var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var LocalStrategy = require('passport-local').Strategy;



var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

//Configure Passport Strategies

passport.use(new LocalStrategy(function(username, password, done) {
  new User({'username': username})
    .fetch()
    .then(function(found) {
      if (!found) {
        return done(null, false, {message: 'Incorrect username.'});
      } else {
        found.checkPassword(password, found.get('password'))
          .then(function(authSuccess) {
            if (!authSuccess) {
              return done(null, false, {message: 'Incorrect password.'});
            } else {
              return done(null, found);
            }
          });
      }
    });
}));

passport.serializeUser(function(user, done) {
  done(null, user.get('id'));
});

passport.deserializeUser(function(id, done) {
  new User({'id': id})
    .fetch()
    .then(function(found) {
      if (!found) {
        done('User Not Found');
      } else {
        done(null, found);
      }
    });
});



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
//Include session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { path: '/', httpOnly: true, secure: false, maxAge: 60000 }
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/', util.authCheck,
function(req, res) {
  res.render('index');
});


app.get('/create', util.authCheck,
function(req, res) {
  res.render('index');
});

app.get('/links', util.authCheck,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.authCheck,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.post('/login', passport.authenticate('local'), function(req, res) {
  var tempPassportSession = req.session.passport;
  req.session.regenerate(function() {
    req.session.passport = tempPassportSession;
    res.redirect('/');
  });
});

app.get('/signup', function(request, response) {
  response.render('signup');
});

app.post('/signup', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  var newUser = new User({'username': username});
  newUser
    .fetch()
    .then(function(found) {
      if (!found) {
        newUser.set('password', password).save().then(function() {
          next();
        });
      } else {
        res.redirect('/register');
      }
    });

}, passport.authenticate('local'), function(req, res) {
  var tempPassportSession = req.session.passport;
  req.session.regenerate(function() {
    req.session.passport = tempPassportSession;
    res.redirect('/');
  });
});

app.get('/logout', function(request, response) {
  request.session.destroy();
  response.redirect('/login');
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
