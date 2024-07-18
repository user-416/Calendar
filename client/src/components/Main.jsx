import React, { useState, useEffect} from 'react';
import calendarService from '../services/calendar';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Main.css';
import TimeUtil from '../utils/TimeUtil';
import DateSelector from './DateSelector';
import TimezoneSelector from './TimezoneSelector';
import DateUtil from '../utils/DateUtil';
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
        console.log(startUTC, endUTC);
        console.log(datesUTC);
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
        <div className="container">
            <div className="calendar-container">
                <DateSelector 
                    selectedDates={selectedDates} 
                    setSelectedDates={setSelectedDates}
                />
            </div>
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <input
                        className="event-input"
                        type="text"
                        placeholder="Enter Event Name: "
                        value={eventName}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = "Enter Event Name: "}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                    />

                    <div className="time-inputs">
                        <input
                            type="text"
                            value={startTime}
                            className="time-field"
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                        <button type="button" onClick={() => setIsAMStart(true)} className={`toggle-button ${isAMStart ? 'active' : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMStart(false)} className={`toggle-button ${!isAMStart ? 'active' : ''}`}>PM</button>

                        <div id="dash"></div>

                        <input
                            type="text"
                            value={endTime}
                            className="time-field"
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                        <button type="button" onClick={() => setIsAMEnd(true)} className={`toggle-button ${isAMEnd ? 'active' : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMEnd(false)} className={`toggle-button ${!isAMEnd ? 'active' : ''}`}>PM</button>
                        <TimezoneSelector timezone={timezone} setTimezone={setTimezone}/>
                    </div>
                    <button id="connect-button" type="submit">Connect</button>
                </form>
            </div>
        </div>
    );
};

export default Main;