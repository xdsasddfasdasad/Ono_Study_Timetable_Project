import React from "react";
import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css"; // base styles
import { localizer } from "../../utils/calendar/localizer";

const BigCalendar = ({ events, onSelectEvent, onSelectSlot }) => {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      defaultView={Views.WEEK}
      selectable
      style={{ height: "calc(100vh - 150px)" }}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
    />
  );
};

export default BigCalendar;
