const doc_id = $('#id').val().trim();
let scheduleElements = {};
let scheduleArray = [];
let PAGE = 0;
let selectApptmnt = undefined;


$('#form-error').hide();



const generateSlotTimes = (sessionTime) => {
    const allSlotTimes = [];
    let mins = 0;
    for (let hr = 0; hr < 24; hr++) {
        while (mins < 60) {
            let value = `${hr.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
            allSlotTimes.push(value);
            mins += sessionTime;
        }
        mins -= 60;
    }
    return allSlotTimes;
};

const createSlotElements = (schdl, allSlotTimes) => {
    const slotElements = [];
    const intervalSlots = allSlotTimes.filter(tSlot => schdl.startDay <= tSlot && tSlot <= schdl.endDay);
    intervalSlots.forEach(tSlot => {
        if (!schdl.breakTimes.includes(tSlot) && !schdl.workTimes.includes(tSlot)) {
            const slotButton = $('<button>');
            slotButton.addClass('slot btn btn-outline-success btn-sm rounded-0 my-1');
            slotButton.text(tSlot);
            slotElements.push(slotButton);
        }
    });
    return slotElements;
};

const createScheduleElements = (schedules) => {
    scheduleElements = {};
    scheduleArray = [];
    PAGE = 0;
    schedules.forEach(schdl => {
        schdl.available = JSON.parse(schdl.available);
        schdl.sessionTime = JSON.parse(schdl.sessionTime);
        if (!schdl.breakTimes) schdl.breakTimes = [];
        if (!schdl.workTimes) schdl.workTimes = [];
        const dayStr = `${schdl.monthName}${schdl.day}`;
        scheduleArray.push(dayStr);
        const allSlotTimes = generateSlotTimes(schdl.sessionTime);
        const slotElements = createSlotElements(schdl, allSlotTimes);
        scheduleElements[dayStr] = {
            ...schdl,
            allSlotTimes,
            slotElements,
        }
    });
};

const renderDayLabels = (day, schdl) => {
    $(`#labelSlotsDay${day}`).text(`${schdl.monthName} ${schdl.day} ${schdl.dayOfWeek}`);
    if (selectApptmnt) selectApptmnt.slotElement.removeClass('active');
    selectApptmnt = undefined;
    $('#labelNewApptmnt').text("Not Selected");
};

const renderDaySlots = (day, {
    available,
    slotElements
}) => {
    $(`#slotsDay${day}`).empty();
    if (available) slotElements.forEach(slotButton => $(`#slotsDay${day}`).append(slotButton));
};

const displaySchedule = (page) => {
    for (let index = 0; index < 7; index++) {
        const dayStr = scheduleArray[index + page * 7];
        const schdl = scheduleElements[dayStr];
        renderDayLabels(index + 1, schdl);
        renderDaySlots(index + 1, schdl);
    }
};

const selectScheduleSection = () => {
    $.get(`/doctor/data/${doc_id}`, ({
        schedules
    }) => {
        console.log(schedules);
        createScheduleElements(schedules);
        displaySchedule(PAGE);
    });
};

selectScheduleSection();


$('#prevPage').on('click', function (e) {
    e.preventDefault();
    if (PAGE === 1) {
        PAGE = 0;
        displaySchedule(PAGE);
    }
});

$('#nextPage').on('click', function (e) {
    e.preventDefault();
    if (PAGE === 0) {
        PAGE = 1;
        displaySchedule(PAGE);
    }
});

$(document).on({
    click: function () {
        const parentId = $(this).parent().attr('id');
        const day = parentId[parentId.length - 1];
        const dayStr = scheduleArray[day - 1 + PAGE * 7];
        const schdl = scheduleElements[dayStr];
        const tSlot = $(this).text().trim();
        if ($(this).hasClass('active')) {
            selectApptmnt = undefined;
            $(this).removeClass('active');
            $('#labelNewApptmnt').text("Not Selected");
        } else {
            if (selectApptmnt) selectApptmnt.slotElement.removeClass('active');
            selectApptmnt = {
                slotElement: $(this),
                slotDateTime: moment(`${schdl.year}-${schdl.month}-${schdl.day} ${tSlot}`)
            }
            $(this).addClass('active');
            $('#labelNewApptmnt').text(selectApptmnt.slotDateTime.format("MMMM Do, h:mm a"));
        }
    }
}, ".slot");


$('#slot_form').submit(function (e) {
    e.preventDefault();
    if ($('#insurance').val() === 'choose') {
        $('#form-error').text('Please select an insurance!');
        $('#form-error').show();
    } else if ($('#reason').val() === 'reason') {
        $('#form-error').text('Please select a reason!');
        $('#form-error').show();
    } else if (!selectApptmnt) {
        $('#form-error').text('Please select a time slot!');
        $('#form-error').show();
    } else {
        $('#form-error').hide();
        const timeSlot = JSON.parse(JSON.stringify(selectApptmnt.slotDateTime.toDate()));
        const bookingDetails = {
            doc_id,
            insurance: $('#insurance').val().trim(),
            reason: $('#reason').val().trim(),
            new_patient: $('input[name="newPatient"]').val().trim(),
            timeSlot
        };
        $.post('/doctor/appointment', {
            bookingDetails
        }, (response) => {
            console.log(response);
        });
    }
});