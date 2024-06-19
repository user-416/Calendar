import React, {useEffect, useState} from "react";
import TimeUtil from "../utils/TimeUtil";
import DateUtil from "../utils/DateUtil";
import "./Grid.css";
import {testcases} from "./Grid-testcases";


const Grid = ({ event }) => {
    //busy intervals is map with key of person and value of maps with keys of dates and values of arrays of pairs of ints
    const busyIntervals = testcases[2];
    const users = Array.from(busyIntervals.keys());
    const { name, startTime: earliestTime, endTime: latestTime, dates } = event;
    const earliestMin = TimeUtil.toMinutes(earliestTime), latestMin = TimeUtil.toMinutes(latestTime);
    const formattedDates = dates.map(
        (date) => new Date(date).toISOString().split("T")[0]
    );
    const totalUsers = busyIntervals.size;
    //const availMap = new Map(); //{date : int[] minutes} (not needed anymore)
    const availUsersMap = new Map(); //{date : String[][] users}
    const transitionMap = new Map();
    const totalMin = TimeUtil.minutesBetween(earliestTime, latestTime);
    
    
    /*const fillAvailMap = () => {
        for (let date of formattedDates) {
            availMap.set(date, new Array(totalMin + 1).fill(0));
            availMap.get(date)[0] = totalUsers;
        }
        
        //line sweep algo
        for (let [user, userIntervals] of busyIntervals.entries()) {
            for (let [date, intervals] of userIntervals.entries()) {
                for (let i = 0; i < intervals.length; i++) {
                    const [startMin, endMin] = intervals[i].split("-").map((time) => TimeUtil.toMinutes(time));
                    const startIdx = startMin - TimeUtil.toMinutes(earliestTime);
                    const endIdx = endMin - TimeUtil.toMinutes(earliestTime);
                    availMap.get(date)[startIdx]--;
                    availMap.get(date)[endIdx]++;
                }
            }
        }
        
        for (let [date, availArr] of availMap.entries()) {
            for (let i = 1; i < availArr.length; i++) {
                availArr[i] += availArr[i - 1];
            }
        }
    };
    fillAvailMap();*/

    const getAvailUsers = (idx, date) => {
        const availUsers = [];
        const curMin = idx + earliestMin;
        for(let [user, userIntervals] of busyIntervals.entries()){
            let isAvail = true;
            for(let interval of userIntervals.get(date)){
                const [startMin, endMin] = interval.split("-").map((time) => TimeUtil.toMinutes(time));
                if (startMin <= curMin && curMin < endMin){
                    isAvail = false;
                    break;
                }
            }
            if(isAvail)
                availUsers.push(user);
        }
        return availUsers;
    }
    const fillAvailUsersMap = () => {
        for(let date of formattedDates){
            availUsersMap.set(date, [])
            for(let i=0; i<totalMin+1; i++){
                availUsersMap.get(date).push(getAvailUsers(i, date));
            }
        }
    }
    fillAvailUsersMap();
    const isDiffAvailUsers = (minIdx1, minIdx2, date) =>{
        const availUsersArr = availUsersMap.get(date);
        return JSON.stringify(availUsersArr[minIdx1].sort()) !== JSON.stringify(availUsersArr[minIdx2].sort());
    }
    const fillTransitionMap= () => {
        for (let date of formattedDates) {
            const transitions = []
            for(let i=1; i<totalMin+1; i++){
                if(isDiffAvailUsers(i, i-1, date))
                    transitions.push(i);
            }
            transitionMap.set(date, transitions);
        }
    };
    fillTransitionMap();

    const generateHourlyIntervals = () => {
        const intervals = [];
        const start = parseInt(earliestTime.slice(0, 2));
        const end = parseInt(latestTime.slice(0, 2));
        for (let hour = start; hour <= end; hour++) {
            intervals.push(TimeUtil.toAMPM(TimeUtil.hoursToHHMM(hour)));
        }
        return intervals;
    };
    const hourlyLabels = generateHourlyIntervals();


    const findInterval = (idx, date) =>{
        const transitions = transitionMap.get(date);
        let start = 0, end = totalMin; 
        for (let i = 0; i < transitions.length; i++) {
            if (idx < transitions[i]) {
                end = transitions[i];
                break;
            }
            start = transitions[i];
        }
        return [start, end];
    }
    const [selectedMinIdx, setSelectedMinIdx] = useState(0);
    const [selectedDate, setSelectedDate] = useState(formattedDates[0]);
    const [start, end] = findInterval(selectedMinIdx, selectedDate);
    const [selectedStartIdx, setSelectedStartIdx] = useState(start);
    const [selectedEndIdx, setSelectedEndIdx] = useState(end);

    const [dateStartIdx, setDateStartIdx] = useState(0);
    const [dateEndIdx, setDateEndIdx] = useState(Math.min(6, formattedDates.length-1));
    const handleCellClick = (idx, date) => {
        setSelectedMinIdx(idx);
        setSelectedDate(date);
        const [start, end] = findInterval(idx, date);
        setSelectedStartIdx(start);
        setSelectedEndIdx(end);
    };

    const forward7Days = () => {
        setDateStartIdx(dateStartIdx+7);
        setDateEndIdx(Math.min(formattedDates.length-1, dateEndIdx+7))
    }

    const back7Days = () => {
        setDateEndIdx(dateStartIdx-1);
        setDateStartIdx(Math.max(0, dateStartIdx-7));
    }

    return (
        <div className="component-container">
            <div className="all-users-wrapper users-wrapper">
                <div className="users-heading">People</div> 
                {users.map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            <div className="navigation-arrows">
                <button onClick={back7Days} disabled={dateStartIdx === 0}>&lt;</button>
                <p className="event-name">{name}</p>
                <button onClick={forward7Days} disabled={dateEndIdx == event.dates.length - 1}>&gt;</button>
            </div>
            <div className="grid-wrapper">
                <div className="hourly-labels">
                    {hourlyLabels.map((time) => (
                        <div key={time} className="hourly-label">{time}</div>
                    ))}
                </div>
                <div className="grid">
                    <div className="date-labels">
                        {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date) => (
                            <div key={date} className="date-label">
                                <div>{DateUtil.toMD(date)}</div>
                                <div>{DateUtil.getDayOfWeek(date)}</div>
                            </div>
                        ))}
                    </div>
                    {Array.from({ length: totalMin }).map((_, minIdx) => (
                        <div key={minIdx} className="grid-row">
                            {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date, dateIdx) => {
                                const availCnt = availUsersMap.get(date)[minIdx].length;
                                const opacity = availCnt / totalUsers; 
                                const isBoundary = minIdx>0 && isDiffAvailUsers(minIdx, minIdx-1, date);
                                const isSelected = selectedDate === date && minIdx >= selectedStartIdx && minIdx < selectedEndIdx;
                                return (
                                    <div
                                        key={`${date}-${minIdx}`}
                                        className="grid-cell"
                                        onClick={() => handleCellClick(minIdx, date)}
                                        style={{ 
                                            backgroundColor: isSelected ? `rgba(0, 100, 255, ${opacity})` : `rgba(0, 128, 0, ${opacity})`,
                                            borderTop: isBoundary ? '1px dashed black' : 'none',
                                            borderLeft: dateIdx===0 ? '2px solid black' : 'none',
                                            borderBottom: minIdx===totalMin-1 ? '2px solid black' : 'none'
                                        }}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            {selectedDate && (
            <div className="availability-wrapper users-wrapper">
                <div className="users-heading">Available</div> 
                <div className="time-interval">{TimeUtil.minutesToAMPM(earliestMin + selectedStartIdx)} - {TimeUtil.minutesToAMPM(earliestMin + selectedEndIdx)}, {DateUtil.toMonthNameD(selectedDate)}:</div>
                {availUsersMap.get(selectedDate)[selectedMinIdx].map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            )}
        </div>
    );
};

export default Grid;
