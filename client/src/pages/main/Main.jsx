import React, { useState, useEffect, useContext} from 'react';
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
    const [startTime, setStartTime] = useState('9:00');
    const [endTime, setEndTime] = useState('5:00');
    const [isAMStart, setIsAMStart] = useState(true);
    const [isAMEnd, setIsAMEnd] = useState(false);
    const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [timezone, setTimezone] = useState(defaultTimezone);

    const [selectedDates, setSelectedDates] = useState(new Set());

    const navigate = useNavigate(); 

    const {authStatus, setAuthStatus} = useContext(AuthContext);
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
                            type="text"
                            value={startTime}
                            className={CSS.timeField}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                        <button type="button" onClick={() => setIsAMStart(true)} className={`${CSS.toggleButton} ${isAMStart ? CSS.active : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMStart(false)} className={`${CSS.toggleButton} ${!isAMStart ? CSS.active : ''}`}>PM</button>

                        <div className={CSS.dash}></div>

                        <input
                            type="text"
                            value={endTime}
                            className={CSS.timeField}
                            onChange={(e) => setEndTime(e.target.value)}
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