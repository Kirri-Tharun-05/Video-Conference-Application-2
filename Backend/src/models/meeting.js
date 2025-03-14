const mongoose = require('mongoose');
const { Schema } = mongoose;

const meeting = new Schema({
    user_id: { type: String },
    meeting_code: { type: String },
    date: {
        type: Date,
        default: Date.now(),
        required:true
    }

})

const Meeting= mongoose.model('Meeting',meeting);
module.exports=Meeting;