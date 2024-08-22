import React, {useEffect, useState, useRef, useContext} from 'react';
import calendarService from '../../services/calendar';
import authService from '../../services/auth';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from './Grid';
import Dropdown from './Dropdown';
import CSS from './Meet.module.css';
import TimezoneSelector from '../../components/TimezoneSelector';
import useCenterWithOffset from '../../hooks/useCenterWithOffset';
import { AuthContext } from '../../contexts/AuthContext';
import NotFound from '../notFound/NotFound';

const Meet = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {authStatus, setAuthStatus} = useContext(AuthContext);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState(new Set());
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [timezone, setTimezone] = useState(defaultTimezone);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const refreshButtonRef = useRef(), authContainerRef = useRef();
    useCenterWithOffset(refreshButtonRef, authContainerRef, 'right', 'margin');
    const getAuthUrl = async () => {
        try {
          const data = await authService.login(id);
          window.location.href = data.url;
        } catch (error) {
          console.error('Error fetching auth URL', error);
        }
    };

    const copyLink = () => {
        const text = document.querySelector(`.${CSS.linkText}`).innerText;
        navigator.clipboard.writeText(text).then(() => {
            const message = document.querySelector(`.${CSS.copyMessage}`);
            message.style.display = "block";
            setTimeout(() => {
                message.style.display = "none";
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
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

    const refreshCalendars = async () => {
        displayRefreshMessage();

        // Toggle selected calendars twice to refresh events
        for (const calendarId of selectedCalendars) {
            await calendarService.toggleCalendar({
                calendarId: calendarId,
                meetingId: id
            });
            await calendarService.toggleCalendar({
                calendarId: calendarId,
                meetingId: id
            });
        }

        // Refresh calendar options
        const allCalendars = await calendarService.getAllCalendars();
        setCalendars(allCalendars);

        setRefreshTrigger(prev => !prev);
    };

    const displayRefreshMessage = () => {
        const refreshMessage = document.querySelector(`.${CSS.refreshMessage}`);
        console.log('re',refreshMessage);
        refreshMessage.style.display = 'block';
        setTimeout(() => {
            refreshMessage.style.display = "none";
        }, 3000);
    }

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
                //navigate('/404'); // Replace with 404
            }
        };

        fetchMeeting();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className={CSS.loadingMessageContainer}>
                <div className={CSS.loadingMessage}>Loading...</div>
            </div>
        )
    }

    if (error) {
        return (
            <NotFound />
        );

    }
    
    return (
        <div className={CSS.meetContainer}>
            <div className={CSS.topContainer}>
                <div className={CSS.linkContainer}>
                    <div className={CSS.linkBox}>
                        <div className={CSS.linkText}>{window.location.href.slice(12)}</div> 
                        <button className={CSS.copyButton} onClick={copyLink}>
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-1.99.9-1.99 2L6 21c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                        </button>
                    </div>
                    <div className={CSS.copyMessage}>Link copied!</div>
                </div>
                <div>
                    {authStatus.authenticated ? (
                        <div className={CSS.authContainer} ref={authContainerRef}>
                            <Dropdown calendars={calendars} selectedCalendars={selectedCalendars} toggleCalendar={toggleCalendar}/>
                            <div className={CSS.refreshContainer}>
                                <button className={CSS.refreshButton} ref={refreshButtonRef} onClick={refreshCalendars}>
                                    <img className={CSS.refreshButton} src='/refresh.svg' alt='refresh'></img>
                                </button>
                                <div className={CSS.refreshMessage}>Calendars refreshed!</div>
                            </div>
                        </div>
                    ) : (
                        <button className={CSS.loginButton} type="button" onClick={getAuthUrl}>
                            Login
                        </button>
                    )}
                </div>
                <div className={CSS.timezoneWrapper}>
                    <TimezoneSelector timezone={timezone} setTimezone={setTimezone}/>
                </div>
            </div>
            <Grid meeting={meeting} id={id} selectedCalendars={selectedCalendars} timezone={timezone} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default Meet;