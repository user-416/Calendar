import React, {useState} from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Main.css';

const Main = () => {
    const [selectedDates, setSelectedDates] = useState([]);
    const [eventName, setEventName] = useState('');
    const [startTime, setStartTime] = useState('0900');
    const [endTime, setEndTime] = useState('1700'); 

    const [isAMStart, setIsAMStart] = useState(true);
    const [isAMEnd, setIsAMEnd] = useState(true);

    const navigate = useNavigate();

    const onDateChange = (date) => {
        const dateString = date.toDateString();
        setSelectedDates(prevDates => {
            if (prevDates.some(d => d.toDateString() === dateString)) {
                return prevDates.filter(d => d.toDateString() !== dateString);
            } else {
                return [...prevDates, date];
            }
        });
    };

    const tileClassName = ({ date }) => {
        return selectedDates.some(d => d.toDateString() === date.toDateString()) ? 'selected' : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/api/create', {
                name: eventName,
                dates: selectedDates,
                startTime: startTime,
                endTime: endTime,
            })

            navigate(response.data);
        } catch (err) {
            console.log('Error creating event', err);
        }
    }

    return (
    <div>
        <div className="container">
            <div className="calendar-container">
                <Calendar onClickDay={onDateChange} tileClassName={tileClassName}/>
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

                    <div className = "time-inputs">
                        <input type="text" defaultValue="9:00" className="time-field" onChange={(e) => setStartTime(e.target.value)}/>
                        <button type="button" onClick={() => setIsAMStart(true)} className={`toggle-button ${isAMStart ? 'active' : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMStart(false)} className={`toggle-button ${!isAMStart ? 'active' : ''}`}>PM</button>

                        <div id="dash"></div>
                        <input type="text" defaultValue="5:00" className="time-field" onChange={(e) => setEndTime(e.target.value)}/>
                        <button type="button" onClick={() => setIsAMEnd(true)} className={`toggle-button ${isAMEnd ? 'active' : ''}`}>AM</button>
                        <button type="button" onClick={() => setIsAMEnd(false)} className={`toggle-button ${!isAMEnd ? 'active' : ''}`}>PM</button>
                    </div>
                    <button id="connect-button" type="submit">Connect</button>
                </form>
            </div>
        </div>
    </div>
    );
};

export default Main;