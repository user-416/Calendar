const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {type: String},
    start: {
        dateTime: {type: String},
        timeZone: {type: String}
    },
    end: {
        dateTime: {type: String},
        timeZone: {type: String}
    }
});


const Event = mongoose.model('Event', eventSchema);

module.exports = {eventSchema, Event}