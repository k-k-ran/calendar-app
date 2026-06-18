import { useState, useRef, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

function highlightAllDayColumns(calRef, events) {
  const api = calRef.current?.getApi()
  if (!api) return
  const el = calRef.current?.elRef?.current
  if (!el) return

  el.querySelectorAll('.fc-day-allday-highlight').forEach(s => s.remove())

  const allDayEvents = events.filter(e => e.allDay || e.extendedProps?.all_day)
  for (const ev of allDayEvents) {
    const dateStr = ev.extendedProps?.date || ev.start
    if (!dateStr) continue
    const date = typeof dateStr === 'string' ? dateStr.split('T')[0] : ''
    const col = el.querySelector(`.fc-timegrid-col[data-date="${date}"]`)
    if (col) {
      const color = ev.backgroundColor || ev.extendedProps?.color || '#6366f1'
      const overlay = document.createElement('div')
      overlay.className = 'fc-day-allday-highlight'
      overlay.style.cssText = `position:absolute;inset:0;background:${color};opacity:0.07;pointer-events:none;z-index:0;`
      col.style.position = 'relative'
      col.appendChild(overlay)
    }
  }
}

export default function CalendarView({ events, onEventClick, onEventDrop, onEventResize, onSelect, onDateClick }) {
  const calRef = useRef(null)

  useEffect(() => {
    const el = calRef.current?.elRef?.current
    if (!el) return
    let startX = 0, startY = 0, startTime = 0
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
    }
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const dt = Date.now() - startTime
      const vx = Math.abs(dx) / dt
      const isHorizontal = Math.abs(dx) > Math.abs(dy)
      if (isHorizontal && (Math.abs(dx) > 30 || vx > 0.2)) {
        const api = calRef.current?.getApi()
        if (api) {
          if (dx > 0) api.incrementDate({ days: -1 })
          else api.incrementDate({ days: 1 })
        }
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const handleDatesSet = useCallback(() => {
    setTimeout(() => highlightAllDayColumns(calRef, events), 50)
  }, [events])

  useEffect(() => {
    handleDatesSet()
  }, [events, handleDatesSet])

  return (
    <FullCalendar
      ref={calRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGrid3Day"
      views={{
        timeGrid3Day: {
          type: 'timeGrid',
          duration: { days: 3 },
          buttonText: '3 Day',
        },
      }}
      firstDay={1}
      headerToolbar={{
        left: 'today',
        center: 'title',
        right: 'dayGridMonth,timeGrid3Day',
      }}
      events={events}
      datesSet={handleDatesSet}
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
      dateClick={onDateClick}
      selectable={true}
      unselectAuto={true}
      buttonText={{ today: 'Today', month: 'Month' }}
      editable={true}
      eventDurationEditable={true}
      height="100%"
      stickyHeaderDates={true}
      eventDisplay="block"
      eventMinHeight={22}
      slotMinTime="00:00:00"
      slotMaxTime="24:00:00"
      slotDuration="01:00:00"
      scrollTime="08:00:00"
      expandRows={false}
      allDayText=""
    />
  )
}
