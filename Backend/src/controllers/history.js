const Meeting = require('../models/meeting');
const User = require('../models/user.js');
const httpsStatus = require('http-status');
const router = require("express").Router();


const getUserHistory = async (req, res) => {
    try {
        console.log(req.session.passport.user)
        const user = await User.findById(req.session.passport.user);
        console.log('from History.js : ', user);
        const meetings = await Meeting.find({ user_id: user.username });
        res.json(meetings);
    } catch (e) {
        console.log('inside getUserHistory');
        res.json({ message: `someting went wrong ${e}` });
    }
}

const addToHistory = async (req, res) => {
    console.log('inside addToHistory function : ',req.body);
    console.log(req.session.passport);
    const { meeting_code } = req.body;
    try {
        console.log('inside try block');
        const user = await User.findById(req.session.passport.user);
        const newMeeting = new Meeting({
            user_id: user.username,
            meeting_code: meeting_code
        })
        await newMeeting.save();
        res.status(200).json({ message: 'Added code to history' });
    } catch (e) { res.json({ message: 'Someting went wrong' }) }
}

module.exports= { getUserHistory, addToHistory };