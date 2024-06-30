import axios from 'axios';

const baseUrl = "http://localhost:3000/";


const getCalendar = async () => {
    const response = await axios.get(baseUrl + 'calendars');
    return response.data;
}

const getAllCalendars = async () => {
    const response = await axios.get(baseUrl + 'api/getAllCalendars', {withCredentials: true});
    return response.data;
}

const getSelectedCalendars = async (meetingId) => {
    const response = await axios.get(baseUrl + `api/getCalendars?meetingId=${meetingId}`, {withCredentials: true})
    return response.data;
}

const getAvailability = async (meetingId) => {
    const response = await axios.get(baseUrl + `api/getAvail?meetingId=${meetingId}`, {withCredentials: true});
    return response.data;
}

const createEvent = async (eventDetails) => {
    const response = await axios.post(baseUrl + 'api/create', eventDetails);
    return response.data;
}

const toggleCalendar = async (calendarDetails) => {
    const response = await axios.post(baseUrl + 'api/toggleCalendar', calendarDetails, {withCredentials: true});
    return response.data;
}


export default {getCalendar, getAllCalendars, getSelectedCalendars, getAvailability, createEvent, toggleCalendar}