const mongoose = require('mongoose');
const Event = require('./event.js')


const meetingSchema = new mongoose.Schema({
    id: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    dates: [{type: Date, required: true}],
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    people: [{type: String, required: true}],
    calendars: [{
            personName: {type: String, required: true}, 
            personCalendar: [
                {calendarId: {type: String, required: true}, events: [Event.eventSchema]}
            ]

        }
    ]
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = {meetingSchema, Meeting}
