import axios from 'axios';

const baseUrl = "https://calendar-bslk.onrender.com/";


const login = async (meetingId) => {
    const response = await axios.get(baseUrl + `login?id=${meetingId}`);
    return response.data;
}

const getMeeting = async (meetingId) => {
    const response = await axios.get(baseUrl + `api/meeting/${meetingId}`);
    return response.data;
}

const getAuth = async () => {
    const response = await axios.get(baseUrl + 'api/auth-status', {withCredentials: true});
    return response.data;
}


export default {login, getMeeting, getAuth}