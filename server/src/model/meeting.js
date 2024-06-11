const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    id: {type: Number, required: true, unique: true},
    name: {type: String, required: true},
    dates: [{type: Date, required: true}],
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    people: [{type: String, required: true}]
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
