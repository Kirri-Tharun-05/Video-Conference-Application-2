const mongoose = require('mongoose');
const {Schema} = mongoose;
const passportLocalMongoose=require('passport-local-mongoose')
const user=new Schema({
    username: String,
    email: String,
    googleId: String,
    profilePicture: String,
    token:{type:String}
})

// Buy default this plugin function passport-local-mongoose will add a username, hash and salted field to store the username,the hashed password and the salt value.
user.plugin(passportLocalMongoose);
const User =mongoose.model('User',user);
module.exports=User;