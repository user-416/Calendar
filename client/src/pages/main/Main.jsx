import React, { useState, useEffect, useContext, useRef} from 'react';
import calendarService from '../../services/calendar';
import { useNavigate } from 'react-router-dom';
import CSS from './Main.module.css';
import TimeUtil from '../../utils/TimeUtil';
import DateSelector from './DateSelector';
import DateUtil from '../../utils/DateUtil';
import TimezoneSelector from '../../components/TimezoneSelector';
import { AuthContext } from '../../contexts/AuthContext';
import authService from '../../services/auth';
const Main = () => {
    const [eventName, setEventName] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('05:00');
    const [isAMStart, setIsAMStart] = useState(true);
    const [isAMEnd, setIsAMEnd] = useState(false);
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [timezone, setTimezone] = useState(defaultTimezone);

    const [selectedDates, setSelectedDates] = useState(new Set());
    const {authStatus, setAuthStatus} = useContext(AuthContext);

    const startFieldRef = useRef(), endFieldRef = useRef();
    const navigate = useNavigate(); 

    const timePattern = "^(0?[1-9]|1[0-2]):[0-5][0-9]$";

    
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!validateTimeInput(startTime, startFieldRef.current)){
            startFieldRef.current.reportValidity();
            return;
        }
        if(!validateTimeInput(endTime, endFieldRef.current)){
            endFieldRef.current.reportValidity();
            return;
        }
        const startHHMM = TimeUtil.toMilitaryTime(startTime, isAMStart)
        const endHHMM = TimeUtil.toMilitaryTime(endTime, isAMEnd);
        const startUTC = TimeUtil.convertToUTC(startHHMM, timezone);
        const endUTC = TimeUtil.convertToUTC(endHHMM, timezone);
        console.log(selectedDates);
        const datesUTC = Array.from(selectedDates)
                        .sort((a,b) => new Date(a)-new Date(b))
                        .map(date => DateUtil.convertToUTC(`${date}T${startHHMM}`, timezone));

        try {
            const eventDetails = {
                name: eventName,
                dates: datesUTC,
                startTime: startUTC,
                endTime: endUTC,
            };

            const data = await calendarService.createEvent(eventDetails);
            console.log(data);  
            navigate(data);
        } catch (err) {
            console.log('Error creating event', err);
        }
    };

    const handleTimeInput = (e, setTime) => {
        e.target.setCustomValidity('');
        setTime(e.target.value);
    }

    const validateTimeInput = (input, field) => {
        if(!/^[0-9]?[0-9]:[0-9][0-9]$/.test(input)){
            field.setCustomValidity('Invalid format. Please use HH:MM.');
            return false;
        }else{
            const [hours, minutes] = input.split(':');
            if(!/^(0?[1-9]|1[0-2])$/.test(hours)){
                field.setCustomValidity('Hours must be between 1 and 12');
                return false;
            }
            else if(!/^[0-5][0-9]$/.test(minutes)){
                field.setCustomValidity('Minutes must be between 0 and 59.');
                return false;
            }
            return true;
        }
    }

    
    return (
        <div className={CSS.mainContainer}>
            <div className={CSS.contentContainer}>
                <DateSelector 
                    selectedDates={selectedDates} 
                    setSelectedDates={setSelectedDates}
                />
                <form className={CSS.formContainer} onSubmit={handleSubmit}>
                    <input
                        className={CSS.eventInput}
                        type="text"
                        placeholder="Event Name: "
                        value={eventName}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = "Enter Event Name: "}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                    />

                    <div className={CSS.timeInputs}>
                        <input
                            ref={startFieldRef}
                            type="text"
                            value={startTime}
                            className={CSS.timeField}
                            onChange={(e) => handleTimeInput(e, setStartTime)}
                            required
                        />
                        <button type="button" onClick={() => setIsAMStart(true)} className={`${CSS.toggleButton} ${isAMStart ? CSS.active : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMStart(false)} className={`${CSS.toggleButton} ${!isAMStart ? CSS.active : ''}`}>PM</button>

                        <div className={CSS.dash}></div>

                        <input
                            ref={endFieldRef}
                            type="text"
                            value={endTime}
                            className={CSS.timeField}
                            onChange={(e) => handleTimeInput(e, setEndTime)}
                            required
                        />
                        <button type="button" onClick={() => setIsAMEnd(true)} className={`${CSS.toggleButton} ${isAMEnd ? CSS.active : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMEnd(false)} className={`${CSS.toggleButton} ${!isAMEnd ? CSS.active : ''}`}>PM</button>
                        <div className={CSS.timezoneContainer}>
                            <TimezoneSelector timezone={timezone} setTimezone={setTimezone}/>
                        </div>


                    </div>
                    <button className={CSS.connectButton} type="submit">Connect</button>
                </form>
            </div>
        </div>
    );
};

export default Main;