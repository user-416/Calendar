import React, {useEffect, useState} from 'react';
import calendarService from '../services/calendar';
import authService from '../services/auth';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './Grid';
import Dropdown from './Dropdown';
import './Meet.css';

const Meet = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authStatus, setAuthStatus] = useState({
        authenticated: false,
        user: null
    });
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState(new Set());

    const getAuthUrl = async () => {
        try {
          const data = await authService.login(id);
          window.location.href = data.url;
        } catch (error) {
          console.error('Error fetching auth URL', error);
        }
    };

    const copyLink = () => { // copy link + display message for 3 secs
        var copyText = document.querySelector('.link-text');

        navigator.clipboard.writeText(copyText.innerText).then(function() {
            var message = document.getElementById("copy-message");
            message.style.display = "block";

            setTimeout(function() {
                message.style.display = "none";
            }, 3000);
        }).catch(function(error) {
            console.error('Error copying text: ', error);
        });
    };

    const toggleCalendar = async (calendar) => {
        try {
            const calendarDetails = {
                calendarId: calendar.id,
                meetingId: id
            }
            await calendarService.toggleCalendar(calendarDetails);

            const newSet = new Set(selectedCalendars);
            if (newSet.has(calendar.id)) {
                newSet.delete(calendar.id);
            } else {
                newSet.add(calendar.id);
            }
            
            setSelectedCalendars(newSet);
        } catch (error) {
            console.error('Error toggling calendar:', error);
        }
    };

    useEffect(() => {
        authService.getAuth()
            .then(data => {
                setAuthStatus({ 
                    authenticated: data.authenticated, 
                    user: data.user
                });
            })
            .catch(error => {
                console.error('Error checking auth status:', error);
                setAuthStatus({authenticated: false, user: null});
            });
    }, []);

    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                const data = await calendarService.getAllCalendars();
                setCalendars(data);
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchCalendars();
    }, []);

    useEffect(() => {
        const fetchSelected = async () => {
            try {
                const data = await calendarService.getSelectedCalendars(id);
                setSelectedCalendars(new Set(data.calendars));
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchSelected();
    }, [id]);

    useEffect(() => {
        const fetchMeeting = async () => {
            try {
                const data = await authService.getMeeting(id);
                setMeeting(data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Meeting not found');
                navigate('/404'); // Replace with 404
            }
        };

        fetchMeeting();
    }, [id, navigate]);

    if (loading) {
        return <div id="loading-message">Loading...</div>;
    }

    if (error) {
        return <div id="error-message">{error}</div>;
    }

    return (
    <div>
        <div className="top-container">
            <div className="link-box">
                <div className="link-text">{window.location.href}</div> 
                <button className="copy-button" onClick={copyLink}>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-1.99.9-1.99 2L6 21c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                </button>
            </div>
            <div id="copy-message">Link copied!</div>
            <div>
                {authStatus.authenticated ? (
                    <Dropdown calendars={calendars} selectedCalendars={selectedCalendars} toggleCalendar={toggleCalendar}/>
                ) : (
                    <button className="login-button" type="button" onClick={getAuthUrl}>
                        Login
                    </button>
                )}
            </div>
        </div>
        <Grid meeting={meeting} id={id} selectedCalendars={selectedCalendars} />
    </div>
    );
};

export default Meet;