import React, { useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Main.css';
import TimeUtil from '../utils/TimeUtil';
import DateUtil from '../utils/DateUtil';
const Main = () => {
    const [selectedDates, setSelectedDates] = useState([]);
    const [eventName, setEventName] = useState('');
    const [startTime, setStartTime] = useState('9:00');
    const [endTime, setEndTime] = useState('5:00');

    const [isAMStart, setIsAMStart] = useState(true);
    const [isAMEnd, setIsAMEnd] = useState(false);


    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());  

    const [startRow, setStartRow] = useState(null);
    const [startCol, setStartCol] = useState(null);
    const [curRow, setCurRow] = useState(null);
    const [curCol, setCurCol] = useState(null);
    let monthMatrix = DateUtil.getMonthMatrix(activeDate);

    const navigate = useNavigate(); 

    const handleActiveStartDateChange = ({activeStartDate}) => {
        setActiveDate(activeStartDate);  
        monthMatrix = DateUtil.getMonthMatrix(activeStartDate);
        for (let i = 0; i < monthMatrix.length; i++) {
            let row = "";
            for (let j = 0; j < monthMatrix[0].length; j++) {
                row += monthMatrix[i][j].toISOString().split("T")[0].substring(5) + " ";
            }
            console.log(row.trim()); 
        }
    };

    const getRowCol = (date) => {
        for(let r=0; r<monthMatrix.length; r++){
            for(let c=0; c<monthMatrix[0].length; c++){
                if(date.toDateString() === monthMatrix[r][c].toDateString())
                    return [r, c];
            }
        }
        console.log('a');
        return [-1, -1];
    }
    
    const handleMouseEnter = (date) => {
        if (isDragging) {
            console.log("mouse enter", date);
            // Ensure that the start indices have been set
            if (startRow === null || startCol === null) {
                return;
            }
            
            const [newRow, newCol] = getRowCol(date);
    
            // First clear the previous range
            for (let r = Math.min(startRow,curRow); r <= Math.max(startRow,curRow); r++) {
                for (let c = Math.min(startCol,curCol); c <= Math.max(startCol,curCol); c++) {
                    if ((r !== newRow || c !== newCol) ||
                        selectedDates.some(d=>d.toDateString()===monthMatrix[r][c].toDateString())) { // Avoid toggling the new current cell
                        toggleSelectedDates(monthMatrix[r][c]);
                    }
                }
            }
    
            // Then set the new range
            for (let r = Math.min(startRow,newRow); r <= Math.max(startRow,newRow); r++) {
                for (let c = Math.min(startCol,newCol); c <= Math.max(startCol,newCol); c++) {
                    toggleSelectedDates(monthMatrix[r][c]);
                }
            }
    
            // Finally, update the current row and column
            setCurRow(newRow);
            setCurCol(newCol);
        }
    }

    const handleMouseDown = (event, date) => {
        //console.log("mouse down",date);
        setDragStart(date);
        setIsDragging(true);
        toggleSelectedDates(date);
        const [sr, sc] = getRowCol(date);
        setStartRow(sr);
        setStartCol(sc);
        setCurRow(sr);
        setCurCol(sc);
    };

    const handleMouseUp = (date) => {
        setDragStart(null);
        //console.log("mouse up");
        setIsDragging(false);
    };


    const toggleSelectedDates = (date) => {
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
        return selectedDates.some(d => d.toDateString() === date.toDateString()) ? 'selected' : 'unselected';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/api/create', {
                name: eventName,
                dates: selectedDates,
                startTime: TimeUtil.toMilitaryTime(startTime, isAMStart),
                endTime: TimeUtil.toMilitaryTime(endTime, isAMEnd),
            });

            navigate(response.data);
        } catch (err) {
            console.log('Error creating event', err);
        }
    };


    return (
        <div>
            <div className="container">
                <div className="calendar-container">
                    <Calendar 
                        /*onClickDay={toggleSelectedDates} */
                        onActiveStartDateChange={handleActiveStartDateChange}
                        tileClassName={tileClassName} 
                        tileContent={({ date, view }) => (
                            <div
                                onMouseDown={(e) => {
                                    handleMouseDown(e, date);
                                }}
                                onMouseEnter={(e) => handleMouseEnter(date)}
                                onMouseUp={(e) => handleMouseUp(date)}
                            />
                        )}
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
                        </div>
                        <button id="connect-button" type="submit">Connect</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Main;