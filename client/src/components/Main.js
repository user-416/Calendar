import React, {useState} from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from 'react-router-dom';
import './Main.css';

const Main = () => {
    const [selectedDates, setSelectedDates] = useState([]);
    const [eventName, setEventName] = useState('');

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(eventName);
    }

    return (
    <div>
        <div class="title">CalConnect</div>
        <div class="container">
            <div class="calendar-container">
                <Calendar onClickDay={onDateChange} tileClassName={tileClassName}/>
            </div>
            <div class="form-container">
                <form onSubmit={handleSubmit}>
                    <input
                    type="text"
                    onChange={(e) => setEventName(e.target.value)}
                    required/>
                    <button type="submit">Connect</button>
                </form>
            </div>

            {/* <p>Please log in to access your calendars and events.</p> */}
            {/* <Link to="/login">Login</Link> */}
        </div>
    </div>
    );
};

export default Main;
