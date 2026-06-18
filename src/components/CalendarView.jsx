import { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarView({ events, onEventClick, onEventDrop, onEventResize, onSelect }) {
  const [fullDay, setFullDay] = useState(false)
  const calRef = useRef(null)

  useEffect(() => {
    const el = calRef.current?.elRef?.current
    if (!el) return
    let touchStartX = 0
    let touchStartY = 0
    const onTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const api = calRef.current?.getApi()
        if (api) dx > 0 ? api.prev() : api.next()
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <FullCalendar
      ref={calRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGrid5Day"
      views={{
        timeGrid5Day: {
          type: 'timeGrid',
          duration: { days: 5 },
          buttonText: '5 Day',
        },
      }}
      firstDay={1}
      customButtons={{
        fullDayToggle: {
          text: fullDay ? '9–9' : '24h',
          click: () => setFullDay(f => !f),
        },
      }}
      headerToolbar={{
        left: 'today',
        center: 'title',
        right: 'dayGridMonth,timeGrid5Day,fullDayToggle',
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
                <div className="fc-event-title fc-sticky">{arg.event.title || ' '}</div>
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
      buttonText={{ today: 'Today', month: 'Month' }}
      editable={true}
      eventDurationEditable={true}
      height="100%"
      eventDisplay="block"
      eventMinHeight={22}
      slotMinTime={fullDay ? '00:00:00' : '09:00:00'}
      slotMaxTime={fullDay ? '24:00:00' : '21:00:00'}
      slotDuration="01:00:00"
      expandRows={true}
    />
  )
}
