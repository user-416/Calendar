import moment from 'moment-timezone';
import TimeUtil from './TimeUtil';
import { endOfHour } from 'date-fns/fp';
class DateUtil {

    //these functions accept strings in the format YYYY-MM-DD
    static getDate(dateInput){
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    static getDayOfWeek(dateInput) {
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
        const date = this.getDate(dateInput);
        return daysOfWeek[date.getDay()];
    }

    static getMonthName(dateInput){
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const date = this.getDate(dateInput);
        return monthNames[date.getMonth()];
    }

    static toMD(dateInput){
        const date = this.getDate(dateInput);
        return `${date.getMonth()+1}/${date.getDate()}`;
    }

    static toMonthNameD(dateInput){
        const date = this.getDate(dateInput);
        return `${this.getMonthName(dateInput)} ${date.getDate()}`;
    }

    static addDaysToDate(dateInput, days) {
        const date = this.getDate(dateInput)
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    static getMonthMatrix = (date) => {
        let matrix = [];
        const year = date.getFullYear();
        const month = date.getMonth();
    
        const monthFirstDate = new Date(year, month, 1); 
        const firstDayOfWeek = monthFirstDate.getDay(); // Sunday: 0
        
        // Adjust calendar to start on Monday 
        let startDate = new Date(monthFirstDate);
        startDate.setDate(startDate.getDate() - firstDayOfWeek + (firstDayOfWeek === 0 ? -6 : 1));
    

        const monthLastDate = new Date(year, month + 1, 0);
        const lastDayOfWeek = monthLastDate.getDay();

        // Adjust calendar to end on Sunday
        const endDate = new Date(monthLastDate);
        endDate.setDate(monthLastDate.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek));
    
        while (startDate <= endDate) {
            let week = [];
            for (let day = 0; day < 7; day++) {
                week.push(new Date(startDate));
                startDate.setDate(startDate.getDate() + 1);
            }
            matrix.push(week);
        }
    
        return matrix;
    };

    static convertToUTC(dateWithTime, timezone){ //make sure dateWithTime is in YYYY-MM-DDTHH:mm format
        const localDateTime = moment.tz(dateWithTime, "YYYY-MM-DDTHH:mm", timezone);
        return localDateTime.utc().format("YYYY-MM-DD");
    }

    static convertFromUTC(dateWithTime, timezone){
        const utcDateTime = moment.utc(dateWithTime, "YYYY-MM-DDTHH:mm");
        return utcDateTime.tz(timezone).format("YYYY-MM-DD");
    }

    static convertBusyIntervalsFromUTC(busyIntervals, timezone){
        for(let [user, userIntervals] of busyIntervals.entries()){
            const newUserIntervals = new Map();
            for(let [date, intervals] of userIntervals){
                for(let interval of intervals){
                    const newDate = this.convertFromUTC(`${date}T${TimeUtil.minutesToHHMM(interval[0])}`, timezone);
                    const newInterval = interval.map(min => TimeUtil.toMinutes(TimeUtil.convertFromUTC(TimeUtil.minutesToHHMM(min), timezone)));
                    if(!newUserIntervals.has(newDate))
                        newUserIntervals.set(newDate, []);
                    newUserIntervals.get(newDate).push(newInterval);
                }
            }
            busyIntervals.set(user, newUserIntervals);
        }
    }

    static convertIntervalMapFromUTC(intervalMap, timezone, earliestMin){
        console.log('before', intervalMap);
        const res = new Map();
        for(let [date, intervalAvail] of intervalMap){
            for(let [start, end, user] of intervalAvail){
                //console.log('toHHMM', TimeUtil.minutesToHHMM(earliestMin));
                const newDate = this.convertFromUTC(`${date}T${TimeUtil.minutesToHHMM(earliestMin)}`, timezone);
                [start, end] = [start, end].map(min => TimeUtil.toMinutes(TimeUtil.convertFromUTC(TimeUtil.minutesToHHMM(min), timezone)));

                if(!res.has(newDate))
                    res.set(newDate, []);
                res.get(newDate).push([start, end, user]);
            }
        }
        console.log('timezone', timezone);
        console.log('after', res);
        return res;
    }
    
}

export default DateUtil;