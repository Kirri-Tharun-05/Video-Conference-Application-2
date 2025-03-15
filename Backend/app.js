require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoute = require("./src/routes/auth.js")
const passportSetup = require('./config/passport');
const httpStatus = require('http-status')
const historyRoute =require('./src/routes/history');
const { createServer } = require('http'); // Add this line

const PORT = 8080;
const mongoose = require('mongoose');
const User = require('./src/models/user');
const cors = require('cors');
const { status } = require('http-status');
const MongoStore = require('connect-mongo');

const { connectionToSocket } = require('./src/controllers/sockets');
const server = createServer(app);
const io = connectionToSocket(server);

main()
  .then(() => { console.log('connection successful'); })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  // await mongoose.connect('mongodb://127.0.0.1:27017/videocall');
}


const sessionOptions = ({
  secret: 'videoCall',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: 'sessions'
  }),
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true, // Use secure cookies for HTTPS
    sameSite: 'none',
  }
});

app.use(
  cors({
    origin: "https://video-conference-application-2.onrender.com", // Allow only your frontend origin
    credentials: true,
    // methods: ["GET", "POST", "PUT", "DELETE"]
  }
));

app.use(express.json()); // ✅ Parses JSON data
app.use(express.urlencoded({ extended: true })); // ✅ Parses form data
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
// this line is to authenticate the user
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/auth", authRoute);
app.use("/history",historyRoute);

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  next();
})


app.get('/home', (req, res) => {
  console.log(status.NOT_FOUND);
  res.send("you are at base route");
})

app.post('/signin', async (req, res) => {
  try {
    console.log('requested for sign in');
    console.log(req.body);
    let { username, password } = req.body;
    let newUser = new User({ username });
    let result = await User.register(newUser, password);
    console.log(result);
    res.status(status.OK).json({ message: "Registered Successfully" })
  }
  catch (e) {
    res.status(status.FORBIDDEN).json({ message: e.message });
  }
})

// app.post('/login', (req, res, next) => {
//   passport.authenticate('local', (err, user) => {
//     if (err) return next(err);
//     if (!user) {  // If authentication fails
//       return res.status(httpStatus.status.UNAUTHORIZED).json({ message: "Invalid credentials" });
//     }
//     req.logIn(user, (err) => {
//       if (err) return next(err);
//       return res.status(httpStatus.status.OK).json({ message: "Successfully Logged In", user });
//     });
//   })(req, res, next);
// });
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) {  // If authentication fails
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      console.log("Session after login:", req.session);
      // ✅ Explicitly set the session cookie
      // res.cookie("connect.sid", req.sessionID, {
      //   httpOnly: true,
      //   secure: true,  // Use 'true' if your server uses HTTPS
      //   sameSite: "none",  // Allows cross-site cookies
      // });
      return res.status(200).json({ message: "Successfully Logged In", user });
    });
  })(req, res, next);
});

app.get("/api/user", async (req, res) => {
  console.log("🔥 `/api/user` route triggered!");
  console.log("🔍 Session data:", req.session);

  // Check if user is authenticated
  if (!req.session.passport || !req.session.passport.user) {
    console.log("❌ No user found in session!");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Fetch user from database using stored user ID
    const user = await User.findById(req.session.passport.user);
    
    if (!user) {
      console.log("❌ User not found in database!");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", user);
    res.json({ name: user.username}); // Adjust according to your schema
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

server.listen(PORT, (req, res) => {
  console.log(`Listening to the port ${PORT}`);
})

