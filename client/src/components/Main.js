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
        <div className="title">CalConnect</div>
        <div className="container">
            <div className="calendar-container">
                <Calendar onClickDay={onDateChange} tileClassName={tileClassName}/>
            </div>
            <div className="form-container">
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
