
import React, { useState, useEffect} from 'react';
import Calendar from 'react-calendar';
import DateUtil from '../../utils/DateUtil';
import 'react-calendar/dist/Calendar.css';
import './DateSelector.css';

const DateSelector = ({selectedDates, setSelectedDates}) => {
    
    const [startRow, setStartRow] = useState(null);
    const [startCol, setStartCol] = useState(null);
    const [curRow, setCurRow] = useState(null);
    const [curCol, setCurCol] = useState(null);
    const [isSelecting, setIsSelecting] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());  
    const [isDragging, setIsDragging] = useState(false);

    let monthMatrix = DateUtil.getMonthMatrix(activeDate);

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
        }
    };

    const getRowCol = (date) => {
        for(let r=0; r<monthMatrix.length; r++){
            for(let c=0; c<monthMatrix[0].length; c++){
                if(date.toISOString().split('T')[0] === monthMatrix[r][c].toISOString().split('T')[0])
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
                        newSelectedDates.delete(monthMatrix[r][c].toISOString().split('T')[0]);
                    else
                        newSelectedDates.add(monthMatrix[r][c].toISOString().split('T')[0]);
                }
            }

            for (let r = Math.min(startRow,newRow); r <= Math.max(startRow,newRow); r++) {
                for (let c = Math.min(startCol,newCol); c <= Math.max(startCol,newCol); c++) {
                    if(isSelecting)
                        newSelectedDates.add(monthMatrix[r][c].toISOString().split('T')[0]);
                    else
                        newSelectedDates.delete(monthMatrix[r][c].toISOString().split('T')[0]);
                }
            }
    
            setSelectedDates(newSelectedDates);
            setCurRow(newRow);
            setCurCol(newCol);
        }
    }

    const handleMouseDown = (event, date) => {
        //console.log("mouse down",date);
        const dateString = date.toISOString().split('T')[0];
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
        setIsDragging(false);
    };


    const tileClassName = ({ date }) => {
        return selectedDates.has(date.toISOString().split('T')[0]) ? 'selected' : 'unselected';
    };

    return ( 
        <div className='calendarContainer'>
            <Calendar 
                onActiveStartDateChange={handleActiveStartDateChange}
                tileClassName={tileClassName} 
                className={'react-calendar'}
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
     );
}
 
export default DateSelector;