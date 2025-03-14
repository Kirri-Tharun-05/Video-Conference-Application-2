const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const User = require('../src/models/user');
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://video-conference-application-2-backend.onrender.com/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const username = profile.displayName;
                const email = profile.emails?.[0]?.value || "";
                const profilePicture = profile.photos?.[0]?.value || '';

                let user = await User.findOne({ googleId });
                if (!user) {
                    user = new User({
                        username,
                        email,
                        googleId,
                        profilePicture
                    });
                    await user.save();
                }
                return done(null, user._id);
            }
            catch (error) {
                return done(error, null);
            }
        }
    )
);
passport.serializeUser((userId, done) => {
    done(null, userId);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        console.log("Deserialized user:", user); 
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});