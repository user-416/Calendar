import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './Grid';
import Dropdown from './Dropdown';
import './Meet.css';

const Meet = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
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
          const response = await axios.get(`http://localhost:3000/login?id=${id}`);
          window.location.href = response.data.url;
        } catch (error) {
          console.error('Error fetching auth URL', error);
        }
    };

    const copyLink = () => {/*copy link, display message for 3 secs*/
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

    const toggleCalendar = (calendar) => {
        setSelectedCalendars(prevSelected => {
            const newSet = new Set(prevSelected);
            if (newSet.has(calendar.id))
                newSet.delete(calendar.id);
            else
                newSet.add(calendar.id);
            return newSet;
        });
    }

    // useEffect(() => {
    //     console.log("Selected calendars:", selectedCalendars);
    //   }, [selectedCalendars]);

    useEffect(() => {
        axios.get('http://localhost:3000/api/auth-status', {withCredentials: true})
            .then(response => {
                setAuthStatus({ 
                    authenticated: response.data.authenticated, 
                    user: response.data.user
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
                const response = await axios.get('http://localhost:3000/api/getCalendars', {withCredentials: true});
                setCalendars(response.data);
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchCalendars();
      }, []);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/events/${id}`);
                setEvent(response.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Event not found');
                navigate('/404'); // Replace with 404
            }
        };

        fetchEvent();
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
                    <button className="add-calendar-button" type="button" onClick={getAuthUrl}>
                        <svg viewBox="0 0 24 24" className="plus-icon">
                            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                        </svg>
                        Login
                    </button>
                )}
            </div>
        </div>
        <Grid event={event} />
    </div>
    );
};

export default Meet;