import React, { useState, useEffect, useRef, useMemo} from 'react';
import Calendar from 'react-calendar';
import DateUtil from '../../utils/DateUtil';
import 'react-calendar/dist/Calendar.css';
import './DateSelector.css';

const DateSelector = ({selectedDates, setSelectedDates}) => {
    
    const startRow = useRef(null);
    const startCol = useRef(null);
    const [curRow, setCurRow] = useState(null);
    const [curCol, setCurCol] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());  

    const isSelecting  = useRef(null);
    const isDragging = useRef(false);

    const isTouch = useRef(null);

    const monthMatrix = useMemo(() => DateUtil.getMonthMatrix(activeDate), [activeDate]);
    const firstCoord = useRef(null);
    useEffect(() => {
        // Stop dragging when mouse is clicked outside calendar
        const stopDragging = () => {
            if (isDragging) {
                isDragging.current = false;
            }
        };
        document.addEventListener('mouseup', stopDragging);

        return () => {
            document.removeEventListener('mouseup', stopDragging);
        };
    }, [isDragging.current]);

    useEffect(() => {
        const firstCell = document.querySelector('.react-calendar__tile');
        const rect = firstCell.getBoundingClientRect();
        firstCoord.current = {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            w: rect.width,
            h: rect.height,
        }

    }, []);

    const handleActiveStartDateChange = ({activeStartDate}) => {
        setActiveDate(activeStartDate);  
    };

    const getRowCol = (date) => {
        const dateString = date.toISOString().split('T')[0];
        for(let r=0; r<monthMatrix.length; r++){
            for(let c=0; c<monthMatrix[0].length; c++){
                if(dateString === monthMatrix[r][c])
                    return [r, c];
            }
        }
        return [-1, -1];
    }
    

    const handleDragEnter = (date, mouse, e) => {
        //e.preventDefault();
        console.log('enter');
        if (isDragging.current) {
            if (startRow.current === null || startCol.current === null) {
                return;
            }
            
            let newRow, newCol;
            if(mouse){
                [newRow, newCol] = getRowCol(date);
            }else{
                const touch = e.touches[0]; // Get the first touch point
                const x = touch.clientX + window.scrollX;
                const y = touch.clientY + window.scrollY;
                const rowCol = getRowColFromCoord(x, y);
                if(rowCol === null)
                    return;
                [newRow, newCol] = rowCol;
            }

            const newSelectedDates = new Set(selectedDates);
            for (let r = Math.min(startRow.current, curRow); r <= Math.max(startRow.current, curRow); r++) {
                for (let c = Math.min(startCol.current, curCol); c <= Math.max(startCol.current, curCol); c++) {
                    if(isSelecting.current)
                        newSelectedDates.delete(monthMatrix[r][c]);
                    else
                        newSelectedDates.add(monthMatrix[r][c]);
                }
            }

            for (let r = Math.min(startRow.current, newRow); r <= Math.max(startRow.current, newRow); r++) {
                for (let c = Math.min(startCol.current, newCol); c <= Math.max(startCol.current, newCol); c++) {
                    if(isSelecting.current)
                        newSelectedDates.add(monthMatrix[r][c]);
                    else
                        newSelectedDates.delete(monthMatrix[r][c]);
                }
            }
    
            setSelectedDates(newSelectedDates);
            setCurRow(newRow);
            setCurCol(newCol);
        }
    }

    const handleDragStart = (date, e) => {
        //e.preventDefault();
        console.log(e.type);
        if(isTouch.current !== null && isTouch.current !== e.type){
            isTouch.current = null;
            return;
        }
        isTouch.current = e.type;
        console.log('start', date);
        const dateString = date.toISOString().split('T')[0];
        isDragging.current = true;
        isSelecting.current = !selectedDates.has(dateString);
 
        const newSelectedDates = new Set(selectedDates);
        if(isSelecting.current)
            newSelectedDates.add(dateString);
        else
            newSelectedDates.delete(dateString);
        setSelectedDates(newSelectedDates);

        const [sr, sc] = getRowCol(date);
        startRow.current = sr;
        startCol.current = sc;
        setCurRow(sr);
        setCurCol(sc);
    };

    const handleDragEnd = (date, e) => {
        console.log('end', date);
        isSelecting.current = null;
        isDragging.current = false;
    };

    const getRowColFromCoord = (x, y) => {
        const dx = x - firstCoord.current.x;
        const dy = y - firstCoord.current.y;

        if (dx < 0 || dy < 0) {
            //console.log("coords are outside calendar");
            return null;
        }

        const c = Math.floor(dx / firstCoord.current.w);
        const r = Math.floor(dy / firstCoord.current.h);
        return [r,c];
    }


    const tileClassName = ({ date }) => {
        return selectedDates.has(date.toISOString().split('T')[0]) ? 'selected' : 'unselected';
    };

    
    return ( 
        <Calendar 
            onActiveStartDateChange={handleActiveStartDateChange}
            tileClassName={tileClassName} 
            className={`react-calendar ${'rows-' + monthMatrix.length}`}
            tileContent={({ date }) => (
                <div
                    onMouseDown={(e) => handleDragStart(date,e)}
                    onTouchStart={(e) => handleDragStart(date,e)}
                    onMouseEnter={(e) => handleDragEnter(date, true, e)}
                    onTouchMove={(e) => handleDragEnter(date, false, e)}
                    onMouseUp={(e) => handleDragEnd(date,e)}
                    onTouchEnd={(e) => handleDragEnd(date,e)}
                />
            )}
        />
     );
}
 
export default DateSelector;