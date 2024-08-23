const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    start: {
        dateTime: {type: String, required: false},
        timeZone: {type: String, required: false},
        date: {type: String, required: false}
    },
    end: {
        dateTime: {type: String, required: false},
        timeZone: {type: String, required: false},
        date: {type: String, required: false}
    }
});


const Event = mongoose.model('Event', eventSchema);

module.exports = {eventSchema, Event}