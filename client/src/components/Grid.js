import React, {useEffect, useState, useMemo} from "react";
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
    const formattedDates = dates.map(date => new Date(date).toISOString().split("T")[0]);
    const totalUsers = busyIntervals.size;
    const totalMin = TimeUtil.minutesBetween(earliestTime, latestTime);
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
    const availUsersMap = useMemo(() => {
        const map = new Map();
        for(let date of formattedDates){
            map.set(date, [])
            for(let i=0; i<totalMin+1; i++){
                map.get(date).push(getAvailUsers(i, date, busyIntervals, earliestMin));
            }
        }
        return map;
    }, [busyIntervals]);

    const intervalMap = useMemo(() => {
        console.log("re-calculate interval map");
        const map = new Map();
        for (let date of formattedDates) {
            const intervals = [];
            let start = earliestMin;
            const availUsers = availUsersMap.get(date);
            for(let i=0; i<totalMin; i++){
                if(JSON.stringify(availUsers[i]) !== JSON.stringify(availUsers[i+1])){
                    const end = earliestMin + i+1;
                    intervals.push([start, end, availUsersMap.get(date)[i-1]]);
                    start = end;
                }
            }
            if(start <= latestMin)
                intervals.push([start, latestMin, availUsersMap.get(date)[totalMin]]);
            map.set(date, intervals);
        }
        return map;
    }, []);

    const hourlyLabels = useMemo(() => {
        console.log("re-calculate hourly labels");
        /*let a = 0;
        while(a<1000000000)
            a++;*/
        const intervals = [];
        const start = parseInt(earliestTime.slice(0, 2));
        const end = parseInt(latestTime.slice(0, 2));
        for (let hour = start; hour <= end; hour++) {
            intervals.push(TimeUtil.toAMPM(TimeUtil.hoursToHHMM(hour)));
        }
        return intervals;
    }, []);

    const [selectedIntervalIdx, setSelectedIntervalIdx] = useState(0);
    const [selectedDate, setSelectedDate] = useState(formattedDates[0]);

    const handleIntervalClick = (date, idx) => {
        setSelectedDate(date);
        setSelectedIntervalIdx(idx);
    }

    const [dateStartIdx, setDateStartIdx] = useState(0);
    const [dateEndIdx, setDateEndIdx] = useState(Math.min(6, formattedDates.length-1));

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
            <div className="grid-wrapper">
                <div className="hourly-labels">
                    {hourlyLabels.map((time) => (
                        <div key={time} className="hourly-label">{time}</div>
                    ))}
                </div>
                <div className="grid-vertical">
                    <div className="navigation-arrows">
                        <button onClick={back7Days} disabled={dateStartIdx === 0}>&lt;</button>
                        <div className="event-name">{name}</div>
                        <button onClick={forward7Days} disabled={dateEndIdx == event.dates.length - 1}>&gt;</button>
                    </div>
                    <div className="date-labels" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)` }}>
                            {formattedDates.slice(dateStartIdx, dateEndIdx+1).map((date, dateIdx) => (
                                <div key={date} className="date-label">
                                    <div>{DateUtil.toMD(date)}</div>
                                    <div>{DateUtil.getDayOfWeek(date)}</div>
                                </div>
                            ))}
                    </div>
                    <div className="grid" style={{ width: `calc((${dateEndIdx} - ${dateStartIdx} + 1) * 5.5vw + 2px)` }}>
                        {formattedDates.slice(dateStartIdx, dateEndIdx + 1).map((date, dateIdx) => (
                            <div key={date} className="grid-col">
                                {intervalMap.get(date).map(([startMin, endMin, availUsers], intervalIdx) => {
                                    const availCnt = availUsers.length;
                                    const opacity = availCnt / totalUsers;
                                    const intervalHeight = endMin - startMin;
                                    const isSelected = date==selectedDate && intervalIdx==selectedIntervalIdx;
                                    return (
                                        <div
                                            key={`${date}-${startMin}-${endMin}`}
                                            className="grid-cell"
                                            onClick={() => handleIntervalClick(date, intervalIdx)}
                                            style={{
                                                height: `${intervalHeight*1.405}px`,  
                                                backgroundColor: isSelected ? `rgba(0, 100, 255, ${opacity+1/(2*totalUsers)})` : `rgba(0, 128, 0, ${opacity})`,
                                                borderBottom: `${intervalIdx === intervalMap.get(date).length - 1 ? '2px' : '1px'} solid black`
                                            }}
                                        >
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {selectedDate && (
            <div className="availability-wrapper users-wrapper">
                <div className="users-heading">Available</div> 
                <div className="time-interval">
                    {TimeUtil.minutesToAMPM(intervalMap.get(selectedDate)[selectedIntervalIdx][0])} - {TimeUtil.minutesToAMPM(intervalMap.get(selectedDate)[selectedIntervalIdx][1])}, {DateUtil.toMonthNameD(selectedDate)}:
                </div>
                {intervalMap.get(selectedDate)[selectedIntervalIdx][2].map(user => (
                    <p key={user} className='user-name'>{user}</p>
                ))}
            </div>
            )}
        </div>
    );
};

export default Grid;
