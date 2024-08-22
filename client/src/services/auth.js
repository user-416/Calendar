import axios from 'axios';

const baseUrl = "https://www.schedit.us/";


const login = async (meetingId) => {
    const response = await axios.get(baseUrl + `login?id=${meetingId}`);
    return response.data;
}

const logout = async () => {
    const response = await axios.get(baseUrl + 'api/logout', {withCredentials: true});
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


export default {login, logout, getMeeting, getAuth}