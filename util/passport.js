const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
const fbConfig = require('../config/fb');

const { PijinRPC, AuthRPC } = require('../includes/proto');

const strategyConfig = {
  clientID: fbConfig.APP_ID,
  clientSecret: fbConfig.APP_SECRET,
  callbackURL: fbConfig.CALLBACK_URL,
};

passport.use(
  'facebook',
  new FacebookStrategy(strategyConfig, async (accToken, refToken, profile, done) => {
    try {
      const authData = await AuthRPC.getAuthorizationByID({ facebookID: profile.id });
      if (authData.data) {
        const user = JSON.parse(authData.data);
        return done(null, user);
      }

      const userData = await PijinRPC.createUser({
        username: `user${parseInt(Math.random() * 10000000000, 10)}`,
      });
      const user = JSON.parse(userData.data);

      await AuthRPC.createAuthorization({
        userID: user._id,
        facebookID: profile.id,
        password: crypto.randomBytes(16).toString('hex'),
      });

      return done(null, user);
    } catch (error) {
      console.error(error);
      return done(error);
    }
  }),
);

module.exports = passport;
