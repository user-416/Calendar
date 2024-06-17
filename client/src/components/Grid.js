import React from "react";
import TimeUtil from "../utils/TimeUtil";
import DateUtil from "../utils/DateUtil";
import "./Grid.css";

const Grid = ({ event }) => {
    //busy intervals is map with key of person and value of maps with keys of dates and values of arrays of pairs of ints
    const busyIntervals = new Map([
        [
            "Alice",
            new Map([
                ["2024-06-16", ["09:04-09:47", "13:00-14:00"]],
                ["2024-06-17", ["10:00-10:30", "15:00-15:30"]],
                ["2024-06-18", ["09:00-10:00", "14:00-14:30"]],
                ["2024-06-19", ["11:00-12:00", "16:00-16:30"]],
                ["2024-06-20", ["08:00-08:30", "12:00-12:30"]],
            ]),
        ],
        [
            "Bob",
            new Map([
                ["2024-06-16", ["09:32-10:08", "12:00-12:30"]],
                ["2024-06-17", ["11:00-11:30", "14:00-14:30"]],
                ["2024-06-18", ["08:30-09:00", "13:00-13:30"]],
                ["2024-06-19", ["10:00-10:30", "15:08-15:30"]],
                ["2024-06-20", ["09:00-09:30", "13:30-14:00"]],
            ]),
        ],
        [
            "Charlie",
            new Map([
                ["2024-06-16", ["08:00-08:30", "10:00-10:30"]],
                ["2024-06-17", ["09:00-09:30", "13:00-13:30"]],
                ["2024-06-18", ["10:30-11:00", "14:30-15:10"]],
                ["2024-06-19", ["08:30-09:00", "12:30-13:00"]],
                ["2024-06-20", ["11:00-11:39", "16:00-16:32"]],
            ]),
        ],
    ]);
    const { name, startTime: earliestTime, endTime: latestTime, dates } = event;
    const earliestMin = TimeUtil.toMinutes(earliestTime), latestMin = TimeUtil.toMinutes(latestTime);
    const formattedDates = dates.map(
        (date) => new Date(date).toISOString().split("T")[0]
    );
    const totalUsers = busyIntervals.size;
    const availMap = new Map(); //{date : int[] minutes}

    const totalMin = TimeUtil.minutesBetween(earliestTime, latestTime);
    const fillAvailMap = () => {
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
    fillAvailMap();

    /*
    const generateIntervalMap = () => {
        //for debugging purposes, not used in rest of code
        const map = new Map();
        for (let [date, A] of availMap.entries()) {
            const intervals = []
            let i=0;
            while(i<A.length){
                let j=i;
                while(i+1<A.length && A[i+1] == A[j]){
                    i++;
                }
                const start = TimeUtil.minutesToHHMM(earliestMin + j), end = TimeUtil.minutesToHHMM(earliestMin + i);
                intervals.push([`${start}-${end}`, A[j]]);
                i++;
            }
            map.set(date, intervals);
        }
        return map;
    };
    const intervalMap = generateIntervalMap();
    console.log(intervalMap)*/
    const generateHourlyIntervals = () => {
        const intervals = [];
        const start = parseInt(earliestTime.slice(0, 2));
        const end = parseInt(latestTime.slice(0, 2));
        for (let hour = start; hour < end; hour++) {
            intervals.push(TimeUtil.toAMPM(TimeUtil.hoursToHHMM(hour)));
        }
        return intervals;
    };
    const hourlyLabels = generateHourlyIntervals();
    

    const getAvailableUsers = (idx, date) => {
        const availUsers = [];
        const curMin = idx + earliestMin;
        for(let [user, userIntervals] of busyIntervals.entries()){
            let isAvail = true;
            for(let interval of userIntervals.get(date)){
                const [startMin, endMin] = interval.split("-").map((time) => TimeUtil.toMinutes(time));
                if (startMin <= curMin <= endMin){
                    isAvail = false;
                    break;
                }
            }
            if(isAvail)
                availUsers.push(user);
        }
        return availUsers;
    }
    const isDifferentAvailableUsers = (idx, prevIdx, date) => {
        const curUsers = getAvailableUsers(idx, date), prevUsers = getAvailableUsers(prevIdx, date);
        return curUsers.sort().join(',') !== prevUsers.sort().join(',');
    
    }
    return (
        <div className="grid-wrapper">
            <div className="hourly-labels">
            {hourlyLabels.map((time) => (
                <div key={time} className="hourly-label">{time}</div>
            ))}
            </div>
            <div className="grid">
                <div className="date-labels">
                    {formattedDates.map((date) => (
                        <div key={date} className="date-label">
                            <div>{DateUtil.toMD(date)}</div>
                            <div>{DateUtil.getDayOfWeek(date)}</div>
                        </div>
                    ))}
                </div>
                {Array.from({ length: totalMin }).map((_, minIdx) => (
                    <div key={minIdx} className="grid-row">
                        {formattedDates.map((date, dateIdx) => {
                            const curAvail = availMap.get(date)[minIdx], prevAvail = availMap.get(date)[minIdx-1];
                            const opacity = curAvail / totalUsers; 
                            const isBoundary = minIdx>0 && (curAvail !== prevAvail || isDifferentAvailableUsers(minIdx, minIdx-1, date))
                            return (
                                <div
                                    key={`${date}-${minIdx}`}
                                    className="grid-cell"
                                    style={{ 
                                        backgroundColor: `rgba(0, 128, 0, ${opacity})` ,
                                        borderTop: isBoundary ? '1px dashed black' : 'none',
                                        borderLeft: dateIdx===0 ? '2px solid black' : 'none',
                                        borderBottom: minIdx===availMap.get(date).length ? '2px solid black' : 'none'
                                    }}
                                ></div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Grid;
