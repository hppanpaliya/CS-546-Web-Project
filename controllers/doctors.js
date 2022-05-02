const moment = require('moment');

const {
    getDoctor,
    updateDoctor
} = require('../models/doctors');



const addApptmntToDocSchedule = async (apptmnt) => {
    const doctor = await getDoctor(apptmnt.doctor_id);
    const apptmntDate = moment(apptmnt.time).format('Y-MM-DD');
    const schdl = doctor.schedules.filter(({
        day,
        month,
        year
    }) => `${year}-${month}-${day}` === apptmntDate)[0];
    const apptmntTime = moment(apptmnt.time).format('HH:mm');
    if (schdl.workTimes) schdl.workTimes.push(apptmntTime);
    else schdl.workTimes = [apptmntTime];
    const result = await updateDoctor(apptmnt.doctor_id, {
        schedules: doctor.schedules
    });
    return result;
};

const removeApptmntFromDocSchedule = async (apptmnt) => {
    const doctor = await getDoctor(apptmnt.doctor_id);
    const apptmntDate = moment(apptmnt.time).format('Y-MM-DD');
    const schdl = doctor.schedules.filter(({
        day,
        month,
        year
    }) => `${year}-${month}-${day}` === apptmntDate)[0];
    const apptmntTime = moment(apptmnt.time).format('HH:mm');
    const index = schdl.workTimes.indexOf(apptmntTime);
    if (index > -1) schdl.workTimes.splice(index, 1);
    const result = await updateDoctor(apptmnt.doctor_id, {
        schedules: doctor.schedules
    });
    return result;
};


module.exports = {
    addApptmntToDocSchedule,
    removeApptmntFromDocSchedule
}