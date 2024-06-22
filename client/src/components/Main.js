import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Main.css';
import TimeUtil from '../utils/TimeUtil';
import DateUtil from '../utils/DateUtil';
const Main = () => {
    const [selectedDates, setSelectedDates] = useState(new Set());
    const [eventName, setEventName] = useState('');
    const [startTime, setStartTime] = useState('9:00');
    const [endTime, setEndTime] = useState('5:00');

    const [isAMStart, setIsAMStart] = useState(true);
    const [isAMEnd, setIsAMEnd] = useState(false);


    const [isDragging, setIsDragging] = useState(false);
    const [activeDate, setActiveDate] = useState(new Date());  

    const [startRow, setStartRow] = useState(null);
    const [startCol, setStartCol] = useState(null);
    const [curRow, setCurRow] = useState(null);
    const [curCol, setCurCol] = useState(null);
    const [isSelecting, setIsSelecting] = useState(null);

    let monthMatrix = DateUtil.getMonthMatrix(activeDate);

    const navigate = useNavigate(); 

    useEffect(() => {
        // Stop dragging when mouse is clicked outside calendar
        const stopDragging = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging]);

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
            if (startRow === null || startCol === null) {
                return;
            }
            
            const [newRow, newCol] = getRowCol(date);
            const newSelectedDates = new Set(selectedDates);
            for (let r = Math.min(startRow,curRow); r <= Math.max(startRow,curRow); r++) {
                for (let c = Math.min(startCol,curCol); c <= Math.max(startCol,curCol); c++) {
                    if(isSelecting)
                        newSelectedDates.delete(monthMatrix[r][c].toDateString());
                    else
                        newSelectedDates.add(monthMatrix[r][c].toDateString());
                }
            }

            for (let r = Math.min(startRow,newRow); r <= Math.max(startRow,newRow); r++) {
                for (let c = Math.min(startCol,newCol); c <= Math.max(startCol,newCol); c++) {
                    if(isSelecting)
                        newSelectedDates.add(monthMatrix[r][c].toDateString());
                    else
                        newSelectedDates.delete(monthMatrix[r][c].toDateString());
                }
            }
    
            setSelectedDates(newSelectedDates);
            setCurRow(newRow);
            setCurCol(newCol);
        }
    }

    const handleMouseDown = (event, date) => {
        //console.log("mouse down",date);
        const dateString = date.toDateString();
        setIsDragging(true);
        const currentlySelecting = !selectedDates.has(dateString);
        setIsSelecting(currentlySelecting);
        const newSelectedDates = new Set(selectedDates);
        if(currentlySelecting)
            newSelectedDates.add(dateString);
        else
            newSelectedDates.delete(dateString);
        setSelectedDates(newSelectedDates);

        const [sr, sc] = getRowCol(date);
        setStartRow(sr);
        setStartCol(sc);
        setCurRow(sr);
        setCurCol(sc);
    };

    const handleMouseUp = (date) => {
        setIsSelecting(null);
        //console.log("mouse up");
        setIsDragging(false);
    };


    const tileClassName = ({ date }) => {
        return selectedDates.has(date.toDateString()) ? 'selected' : 'unselected';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/api/create', {
                name: eventName,
                dates: Array.from(selectedDates).toSorted((a,b) => new Date(a)-new Date(b)), //convert set to arr and sort
                startTime: TimeUtil.toMilitaryTime(startTime, isAMStart),
                endTime: TimeUtil.toMilitaryTime(endTime, isAMEnd),
            });
            console.log(response.data);  
            navigate(response.data);
        } catch (err) {
            console.log('Error creating event', err);
        }
    };


    return (
        <div className="container">
            <div className="calendar-container">
                <Calendar 
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
    );
};

export default Main;