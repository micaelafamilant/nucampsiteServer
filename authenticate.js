const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const FacebookTokenStrategy = require("passport-facebook-token");

const config = require("./config.js");

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = (user) => {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload:", jwt_payload);

    User.findOne({ _id: jwt_payload._id })
      .then((user) => {
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
      .catch((err) => done(err, false));
  })
);

exports.verifyUser = passport.authenticate("jwt", { session: false });

// Middleware to verify if the user has admin privileges
exports.verifyAdmin = (req, res, next) => {
  // Check if the user is authenticated and if the user has admin privileges
  if (req.user && req.user.admin) {
    return next(); // Allow the request to continue if the user is an admin
  } else {
    // Create an error if the user is not authorized
    const err = new Error("You are not authorized to perform this operation!");
    err.status = 403; // Forbidden status
    return next(err); // Pass the error to the next middleware (error handler)
  }
};

exports.facebookPassport = passport.use(
  new FacebookTokenStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret,
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ facebookId: profile.id })
        .then((user) => {
          if (user) {
            return done(null, user);
          } else {
            let newUser = new User({ username: profile.displayName });
            newUser.facebookId = profile.id;
            newUser.firstname = profile.name.givenName;
            newUser.lastname = profile.name.familyName;
            return newUser.save().then((user) => done(null, user));
          }
        })
        .catch((err) => done(err, false));
    }
  )
);
