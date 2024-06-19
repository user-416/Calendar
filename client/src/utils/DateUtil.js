class DateUtil {

    //these functions accept both strings in the format YYYY-MM-DD
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
}

export default DateUtil;