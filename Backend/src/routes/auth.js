const router = require("express").Router();
const passport = require("passport");
const CLIENT_URL = "https://video-conference-application-2.onrender.com/home";
const User= require('../models/user');

router.get('/user',(req,res)=>{
  // console.log('inside auth.js /user req: ',req);
  console.log('inside auth.js /user req: ',req.user);
    if(req.user){
      console.log('inside auth.js')
      console.log(req.user);
      res.status(200).json(req.user);
    }
    else{
      res.status(401).json({message:'not authenticated'});
    }
})
router.get("/login/success", (req, res) => {
  // console.log('inside auth req: ',req);
  console.log('inside auth req: ',req.user);
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "successful",
      user: req.user,
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }
});
router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => { // ✅ Pass a callback function
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {  // ✅ Destroy session
      res.clearCookie("connect.sid"); // ✅ Clear session cookie
      res.status(200).json({ message: "Logged out successfully" }); // ✅ Redirect to home page
    });
  });
});

router.get("/google",
  passport.authenticate("google",
    {
      scope: ["profile", 'email'],
      prompt: 'select_account' // ✅ Forces Google to show the account selection screen 
    }));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);
module.exports = router