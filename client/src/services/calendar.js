import axios from 'axios';

const baseUrl = "http://localhost:3000/";

const getCalendar = async () => {
    const response = await axios.get(baseUrl + 'calendars');
    return response.data;
}

const getEvents = async (calendarId) => {
    const response = await axios.get(baseUrl + `/events?calendar=${calendarId}`);
    return response.data;
}

const createEvent = async (eventDetails) => {
    const response = await axios.post(baseUrl + `api/create`, eventDetails);
    return response.data;
}


export default {getCalendar, getEvents, createEvent}