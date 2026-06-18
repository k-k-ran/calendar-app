import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarView({ events, onEventClick, onEventDrop, onEventResize, onSelect }) {
  const [fullDay, setFullDay] = useState(false)

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      firstDay={1}
      customButtons={{
        fullDayToggle: {
          text: fullDay ? '9am–9pm' : '24h',
          click: () => setFullDay(f => !f),
        },
      }}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,fullDayToggle',
      }}
      events={events}
      eventContent={(arg) => {
        const notes = arg.event.extendedProps?.notes
        const isTimeGrid = arg.view.type.startsWith('timeGrid')
        if (isTimeGrid) {
          return (
            <div className="fc-event-main-frame">
              {arg.timeText && <div className="fc-event-time">{arg.timeText}</div>}
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">{arg.event.title || ' '}</div>
              </div>
              {notes && <div className="fc-event-notes">{notes}</div>}
            </div>
          )
        }
        return (
          <>
            {arg.timeText && <div className="fc-event-time">{arg.timeText}</div>}
            <div className="fc-event-title">{arg.event.title}</div>
          </>
        )
      }}
      eventClick={onEventClick}
      eventDrop={onEventDrop}
      eventResize={onEventResize}
      select={onSelect}
      selectable={true}
      unselectAuto={true}
      buttonText={{ today: 'Today', month: 'Month', week: 'Week' }}
      editable={true}
      eventDurationEditable={true}
      height="100%"
      eventDisplay="block"
      eventMinHeight={22}
      slotMinTime={fullDay ? '00:00:00' : '09:00:00'}
      slotMaxTime={fullDay ? '24:00:00' : '21:00:00'}
      expandRows={true}
    />
  )
}
