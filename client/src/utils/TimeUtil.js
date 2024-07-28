import moment from 'moment-timezone';
class TimeUtil{
    static toMilitaryTime(time, isAM=null){
        if(isAM === null){
            isAM = time.slice(-2) === "AM";
            time = time.slice(0, -4);
        }
        let [hours, mins] = time.split(':').map(Number);
        if(isAM){
            if(hours === 12)
                hours = 0;
        }else{
            if(hours < 12)
                hours += 12;
        }
        return hours.toString().padStart(2,'0') + ":" + mins.toString().padStart(2,'0');
    }
    static hoursToHHMM(hour) {
        const hourStr = hour.toString().padStart(2, '0'); 
        return `${hourStr}:${'00'}`;
    };
    static toAMPM(time){
        let hrs = parseInt(time.slice(0, 2));
        if(hrs >= 24)
            hrs -= 24;
        const mins = time.slice(3);
        const AMPM = hrs < 12 ? "AM" : "PM";
        const adjustedHrs = hrs % 12 || 12;
        return `${adjustedHrs}:${mins} ${AMPM}`;
    }

    static toMinutes(time){
        const hrs = parseInt(time.slice(0, 2));
        const mins = parseInt(time.slice(3));
        return hrs * 60 + mins;
    }

    static minutesBetween(start, end){
        return this.toMinutes(end) - this.toMinutes(start);
    }

    static minutesToHHMM(minutes){
        const hrs = Math.floor(minutes/60);
        const mins = minutes % 60;
        return hrs.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0'); 
    }

    static minutesToAMPM(minutes){
        return this.toAMPM(this.minutesToHHMM(minutes));
    }

    static roundNearestHour(time, direction){
        let [hours, minutes] = time.split(':').map(s => Number(s));
        if(minutes === 0)
            return time;
        if(direction == 'down')
            hours++;
        
        return `${hours.toString().padStart(2,'0')}:00`;
    }

    static convertToUTC(time, timezone){
        return moment.tz(time, "HH:mm", timezone).utc().format("HH:mm");
    }

    static convertFromUTC(time, timezone){
        return moment.utc(time, "HH:mm").tz(timezone).format("HH:mm");
    }
}

export default TimeUtil;