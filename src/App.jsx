import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import CalendarView from './components/CalendarView'
import AddCourseModal from './components/AddCourseModal'
import AddEventModal from './components/AddEventModal'
import EditEventModal from './components/EditEventModal'
import EditCourseModal from './components/EditCourseModal'
import SlotChoiceModal from './components/SlotChoiceModal'
import EventDetailModal from './components/EventDetailModal'
import LessonScopeModal from './components/LessonScopeModal'
import ConfirmModal from './components/ConfirmModal'
import ManagePeopleModal from './components/ManagePeopleModal'
import './App.css'

const SEL_KEY = 'calendar_selected_people'
const loadSavedSelection = () => {
  try {
    const raw = localStorage.getItem(SEL_KEY)
    if (raw === null) return null
    return new Set(JSON.parse(raw) || [])
  } catch { return null }
}
const saveSelection = (set) => {
  try { localStorage.setItem(SEL_KEY, JSON.stringify([...set])) } catch {}
}

const COURSE_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#14b8a6',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
  '#f43f5e', '#f97316', '#84cc16', '#06b6d4',
  '#0ea5e9', '#7c3aed', '#64748b', '#d97706',
]

const ONGOING_WEEKS = 156

function generateLessonEvents(course) {
  const count = course.total_lessons || ONGOING_WEEKS
  const start = new Date(course.start_date + 'T00:00:00')
  const events = []
  for (let i = 0; i < count; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i * 7)
    events.push({
      id: crypto.randomUUID(),
      event_type: 'lesson',
      course_id: course.id,
      course_name: course.name,
      date: d.toISOString().split('T')[0],
      start_time: course.start_time,
      end_time: course.end_time,
      lesson_number: i + 1,
      total_lessons: course.total_lessons,
      status: 'upcoming',
      color: course.color,
      notes: '',
      person_id: course.person_id,
    })
  }
  return events
}

function autoAttend(events) {
  const today = new Date().toISOString().split('T')[0]
  return events.map(e => {
    if (!e.course_id || e.total_lessons == null || e.status === 'missed') return e
    if (e.date < today && e.status !== 'attended') return { ...e, status: 'attended' }
    if (e.date >= today && e.status === 'attended') return { ...e, status: 'upcoming' }
    return e
  })
}

function toFcEvents(events, people) {
  const peopleMap = Object.fromEntries(people.map(p => [p.id, p]))
  return events.map(e => {
    const person = peopleMap[e.person_id] || {}
    if (e.course_id) {
      const courseEvents = events.filter(ev => ev.course_id === e.course_id)
      const title = e.total_lessons
        ? `${e.course_name} (${e.lesson_number}/${e.total_lessons})`
        : e.course_name
      return {
        id: e.id,
        title,
        start: `${e.date}T${e.start_time}`,
        end: `${e.date}T${e.end_time}`,
        backgroundColor: e.color,
        borderColor: e.color,
        classNames: [`status-${e.status}`],
        extendedProps: {
          event_type: 'lesson',
          course_id: e.course_id,
          course_name: e.course_name,
          lesson_number: e.lesson_number,
          total_lessons: e.total_lessons,
          status: e.status,
          notes: e.notes || '',
          lessons_attended: courseEvents.filter(ev => ev.status === 'attended').length,
          lessons_upcoming: courseEvents.filter(ev => ev.status === 'upcoming').length,
          lessons_missed: courseEvents.filter(ev => ev.status === 'missed').length,
          color: e.color,
          start_time: e.start_time,
          end_time: e.end_time,
          date: e.date,
          person_id: e.person_id,
          person_name: person.name || '',
          person_color: person.color || '#6366f1',
        },
      }
    }
    const allDay = e.all_day || false
    return {
      id: e.id,
      title: e.title,
      start: allDay ? e.date : `${e.date}T${e.start_time}`,
      end: allDay ? e.date : `${e.date}T${e.end_time}`,
      allDay,
      backgroundColor: e.color,
      borderColor: e.color,
      extendedProps: {
        event_type: 'event',
        title: e.title,
        all_day: allDay,
        notes: e.notes || '',
        color: e.color,
        start_time: e.start_time,
        end_time: e.end_time,
        date: e.date,
        status: e.status || 'upcoming',
        person_id: e.person_id,
        person_name: person.name || '',
        person_color: person.color || '#6366f1',
      },
    }
  })
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [rawEvents, setRawEvents] = useState([])
  const [courses, setCourses] = useState([])
  const [people, setPeople] = useState([])
  const [selectedPeople, setSelectedPeople] = useState(new Set())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [showChoice, setShowChoice] = useState(false)
  const [clickedSlot, setClickedSlot] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [showManagePeople, setShowManagePeople] = useState(false)
  const [showLessonScope, setShowLessonScope] = useState(false)
  const [lessonScopeAction, setLessonScopeAction] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [mobileTab, setMobileTab] = useState('calendar')

  const pendingRef = useRef(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchData = useCallback(async () => {
    const [{ data: evData }, { data: coData }, { data: peData }] = await Promise.all([
      supabase.from('events').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('people').select('*'),
    ])
    const attendedEvents = autoAttend(evData || [])
    setRawEvents(attendedEvents)
    setCourses(coData || [])
    setPeople(peData || [])
    setError(null)

    const statusUpdates = attendedEvents.filter((e, i) => {
      const orig = (evData || [])[i]
      return orig && orig.id === e.id && orig.status !== e.status
    })
    if (statusUpdates.length > 0) {
      await Promise.all(statusUpdates.map(e =>
        supabase.from('events').update({ status: e.status }).eq('id', e.id)
      ))
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      const saved = loadSavedSelection()
      const validIds = new Set((peData || []).map(p => p.id))
      if (saved === null) {
        setSelectedPeople(new Set((peData || []).map(p => p.id)))
      } else {
        setSelectedPeople(new Set([...saved].filter(id => validIds.has(id))))
      }
    }
  }, [])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])
  useEffect(() => { if (hasLoadedRef.current) saveSelection(selectedPeople) }, [selectedPeople])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRawEvents([])
    setCourses([])
    setPeople([])
  }

  const togglePerson = (personId) => {
    setSelectedPeople(prev => {
      const next = new Set(prev)
      next.has(personId) ? next.delete(personId) : next.add(personId)
      return next
    })
  }

  const handleUpdatePerson = async (personId, updates) => {
    await supabase.from('people').update(updates).eq('id', personId)
    await fetchData()
  }

  const handleAddPerson = async (personData) => {
    const { data } = await supabase.from('people').insert(personData).select().single()
    await fetchData()
    if (data) setSelectedPeople(prev => new Set([...prev, data.id]))
  }

  const handleDeletePerson = (personId) => {
    setConfirm({
      message: 'Delete this person? Their events will be reassigned to the first person.',
      onConfirm: async () => {
        const firstPerson = people.find(p => p.id !== personId)
        if (firstPerson) {
          await supabase.from('events').update({ person_id: firstPerson.id }).eq('person_id', personId)
          await supabase.from('courses').update({ person_id: firstPerson.id }).eq('person_id', personId)
        }
        await supabase.from('people').delete().eq('id', personId)
        setSelectedPeople(prev => { const next = new Set(prev); next.delete(personId); return next })
        await fetchData()
        setConfirm(null)
      },
    })
  }

  const handleEventClick = (info) => {
    setSelectedEvent({ id: info.event.id, ...info.event.extendedProps })
  }

  const handleSelect = (info) => {
    const date = info.startStr.split('T')[0]
    const startTime = info.startStr.includes('T') ? info.startStr.split('T')[1].substring(0, 5) : '10:00'
    const endTime = info.endStr?.includes('T') ? info.endStr.split('T')[1].substring(0, 5) : null
    setClickedSlot({ date, startTime, endTime, allDay: info.allDay })
    setShowChoice(true)
  }

  const handleDateClick = (info) => {
    const date = info.dateStr.split('T')[0]
    const startTime = info.dateStr.includes('T') ? info.dateStr.split('T')[1].substring(0, 5) : '10:00'
    setClickedSlot({ date, startTime, endTime: null, allDay: info.allDay })
    setShowChoice(true)
  }

  const saveEventSchedule = async (info, scope) => {
    const startStr = info.event.startStr
    const endStr = info.event.endStr
    const hasTime = startStr.includes('T')
    const newDate = startStr.split('T')[0]
    const origStart = info.event.extendedProps.start_time
    const origEnd = info.event.extendedProps.end_time
    const newStartTime = hasTime ? startStr.split('T')[1].substring(0, 5) : origStart
    const newEndTime = hasTime && endStr ? endStr.split('T')[1].substring(0, 5) : origEnd

    if (scope === 'future' && info.event.extendedProps.course_id) {
      const courseId = info.event.extendedProps.course_id
      const lessonNum = info.event.extendedProps.lesson_number || 0
      const target = rawEvents.find(e => e.id === info.event.id)
      let dateOffset = 0
      if (target) {
        const old = new Date(target.date + 'T00:00:00')
        const nw = new Date(newDate + 'T00:00:00')
        dateOffset = Math.round((nw - old) / 86400000)
      }
      for (const e of rawEvents) {
        if (e.course_id === courseId && (e.lesson_number || 0) >= lessonNum) {
          const updates = {}
          if (dateOffset !== 0) {
            const d = new Date(e.date + 'T00:00:00')
            d.setDate(d.getDate() + dateOffset)
            updates.date = d.toISOString().split('T')[0]
          }
          if (hasTime) { updates.start_time = newStartTime; updates.end_time = newEndTime }
          if (Object.keys(updates).length > 0) {
            await supabase.from('events').update(updates).eq('id', e.id)
          }
        }
      }
    } else {
      await supabase.from('events').update({
        date: newDate, start_time: newStartTime, end_time: newEndTime,
      }).eq('id', info.event.id)
    }
    await fetchData()
  }

  const handleEventDrop = async (info) => {
    if (info.event.extendedProps.event_type === 'lesson') {
      pendingRef.current = { action: 'drop', info }
      setLessonScopeAction('drop')
      setShowLessonScope(true)
      return
    }
    await saveEventSchedule(info, 'one')
  }

  const handleEventResize = async (info) => {
    if (info.event.extendedProps.event_type === 'lesson') {
      pendingRef.current = { action: 'resize', info }
      setLessonScopeAction('resize')
      setShowLessonScope(true)
      return
    }
    await saveEventSchedule(info, 'one')
  }

  const handleLessonReschedule = (id, date, startTime, endTime) => {
    pendingRef.current = { action: 'reschedule', id, date, startTime, endTime }
    setLessonScopeAction('reschedule')
    setShowLessonScope(true)
    setSelectedEvent(null)
  }

  const handleScopeChoice = async (scope) => {
    setShowLessonScope(false)
    const pending = pendingRef.current
    pendingRef.current = null
    setLessonScopeAction(null)
    if (!scope) {
      if (pending?.action !== 'reschedule') pending?.info.revert()
      return
    }
    if (!pending) return
    if (pending.action === 'reschedule') {
      if (scope === 'future') {
        const target = rawEvents.find(e => e.id === pending.id)
        if (target && target.course_id) {
          const lessonNum = target.lesson_number || 0
          const dateOffset = Math.round(
            (new Date(pending.date + 'T00:00:00') - new Date(target.date + 'T00:00:00')) / 86400000
          )
          for (const e of rawEvents) {
            if (e.course_id === target.course_id && (e.lesson_number || 0) >= lessonNum) {
              const updates = {}
              if (dateOffset !== 0) {
                const d = new Date(e.date + 'T00:00:00')
                d.setDate(d.getDate() + dateOffset)
                updates.date = d.toISOString().split('T')[0]
              }
              updates.start_time = pending.startTime
              updates.end_time = pending.endTime
              if (Object.keys(updates).length > 0) {
                await supabase.from('events').update(updates).eq('id', e.id)
              }
            }
          }
        }
      } else {
        await supabase.from('events').update({
          date: pending.date, start_time: pending.startTime, end_time: pending.endTime,
        }).eq('id', pending.id)
      }
      await fetchData()
    } else {
      await saveEventSchedule(pending.info, scope)
    }
  }

  const handleStatusUpdate = async (eventId, status) => {
    await supabase.from('events').update({ status }).eq('id', eventId)
    await fetchData()
    setSelectedEvent(null)
  }

  const handleSaveNotes = async (eventId, notes) => {
    await supabase.from('events').update({ notes }).eq('id', eventId)
    await fetchData()
  }

  const handleDeleteEvent = (eventId) => {
    setSelectedEvent(null)
    setConfirm({
      message: 'Delete this event?',
      onConfirm: async () => {
        await supabase.from('events').delete().eq('id', eventId)
        await fetchData()
        setConfirm(null)
      },
    })
  }

  const handleDeleteCourse = (courseId) => {
    setConfirm({
      message: 'Delete this course and all its lessons?',
      onConfirm: async () => {
        await supabase.from('events').delete().eq('course_id', courseId)
        await supabase.from('courses').delete().eq('id', courseId)
        await fetchData()
        setConfirm(null)
      },
    })
  }

  const handleAddCourse = async (courseData) => {
    const courseId = crypto.randomUUID()
    const course = { id: courseId, ...courseData }
    await supabase.from('courses').insert(course)
    const lessonEvents = generateLessonEvents(course)
    for (let i = 0; i < lessonEvents.length; i += 500) {
      await supabase.from('events').insert(lessonEvents.slice(i, i + 500))
    }
    setShowAddCourse(false)
    setClickedSlot(null)
    await fetchData()
  }

  const handleAddEvent = async (eventData) => {
    const event = {
      id: crypto.randomUUID(),
      event_type: 'event',
      course_id: null,
      status: 'upcoming',
      person_id: eventData.person_id || people[0]?.id,
      ...eventData,
    }
    await supabase.from('events').insert(event)
    setShowAddEvent(false)
    setClickedSlot(null)
    await fetchData()
  }

  const handleEditEvent = async (eventData) => {
    await supabase.from('events').update(eventData).eq('id', editingEvent.id)
    setShowEditEvent(false)
    setEditingEvent(null)
    await fetchData()
  }

  const handleEditCourse = async (courseData) => {
    await supabase.from('courses').update(courseData).eq('id', editingCourse.id)
    const eventUpdates = {}
    if (courseData.name) eventUpdates.course_name = courseData.name
    if (courseData.color) eventUpdates.color = courseData.color
    if (courseData.person_id) eventUpdates.person_id = courseData.person_id
    if (Object.keys(eventUpdates).length > 0) {
      await supabase.from('events').update(eventUpdates).eq('course_id', editingCourse.id)
    }
    setShowEditCourse(false)
    setEditingCourse(null)
    await fetchData()
  }

  if (authLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' }}>Loading...</div>
  }

  if (!user) {
    return <Auth onAuth={setUser} />
  }

  const fcEvents = toFcEvents(rawEvents, people)
  const multiPerson = selectedPeople.size > 1
  const visibleEvents = fcEvents
    .filter(e => selectedPeople.has(e.extendedProps?.person_id))
    .map(e => {
      if (multiPerson && e.extendedProps?.person_name) {
        return { ...e, title: `${e.title}  [${e.extendedProps.person_name}]` }
      }
      return e
    })

  const courseStats = courses
    .filter(c => selectedPeople.has(c.person_id))
    .map(course => {
      const courseEvents = rawEvents.filter(e => e.course_id === course.id)
      return {
        ...course,
        attended: courseEvents.filter(e => e.status === 'attended').length,
        upcoming: courseEvents.filter(e => e.status === 'upcoming').length,
        missed: courseEvents.filter(e => e.status === 'missed').length,
      }
    })

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = fcEvents
    .filter(e => selectedPeople.has(e.extendedProps?.person_id) &&
      e.extendedProps?.date >= today && e.extendedProps?.status === 'upcoming')
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 7)

  const searchLow = searchQuery.toLowerCase()
  const filteredUpcoming = upcomingEvents.filter(e =>
    !searchQuery ||
    e.title?.toLowerCase().includes(searchLow) ||
    e.extendedProps?.person_name?.toLowerCase().includes(searchLow)
  )
  const filteredCourses = courseStats.filter(c =>
    !searchQuery ||
    c.name?.toLowerCase().includes(searchLow) ||
    people.find(p => p.id === c.person_id)?.name?.toLowerCase().includes(searchLow)
  )

  const fmtShortDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })

  const defaultPersonId = people[0]?.id

  return (
    <div className="app">
      <nav className="mobile-tabs">
        <button className={`mobile-tab ${mobileTab === 'calendar' ? 'active' : ''}`} onClick={() => setMobileTab('calendar')}>Calendar</button>
        <button className={`mobile-tab ${mobileTab === 'list' ? 'active' : ''}`} onClick={() => setMobileTab('list')}>List</button>
      </nav>
      {error && (
        <div className="error-toast" onClick={() => setError(null)} role="alert">
          <span>{error}</span>
          <span className="error-toast-x">×</span>
        </div>
      )}
      <aside className={`sidebar ${mobileTab === 'list' ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <h1 className="app-title">Calendar</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="manage-people-btn" onClick={() => setShowManagePeople(true)}>People</button>
            <button className="manage-people-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="courses-list">
          <input
            className="sidebar-search"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <p className="section-label">Upcoming</p>
          {filteredUpcoming.length === 0 && (
            <p className="empty-msg">{searchQuery ? 'No results.' : 'No upcoming events.'}</p>
          )}
          {filteredUpcoming.map(e => (
            <div
              key={e.id}
              className="event-item"
              onClick={() => setSelectedEvent({ id: e.id, ...e.extendedProps })}
            >
              <span className="course-dot" style={{ background: e.extendedProps.color }} />
              <div className="event-item-info">
                <span className="event-item-title">{e.title}</span>
                <div className="event-item-meta">
                  <span className="event-item-date">{fmtShortDate(e.extendedProps.date)}</span>
                  {multiPerson && e.extendedProps.person_name && (
                    <span className="event-item-person" style={{ color: e.extendedProps.person_color }}>
                      {e.extendedProps.person_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          <hr className="sidebar-divider" />

          <p className="section-label">Courses</p>
          {filteredCourses.length === 0 && (
            <p className="empty-msg">{searchQuery ? 'No results.' : 'No courses yet.'}</p>
          )}
          {filteredCourses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <span className="course-dot" style={{ background: course.color }} />
                <span className="course-name">{course.name}</span>
                {multiPerson && (
                  <span className="course-person-dot" style={{ background: people.find(p => p.id === course.person_id)?.color }} />
                )}
                <button className="edit-btn" onClick={() => { setEditingCourse(course); setShowEditCourse(true) }} title="Edit">✎</button>
                <button className="delete-btn" onClick={() => handleDeleteCourse(course.id)} title="Delete">×</button>
              </div>
              {course.total_lessons ? (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(course.attended / course.total_lessons) * 100}%`,
                        background: course.color,
                      }}
                    />
                  </div>
                  <div className="progress-stats">
                    <span className="stat-attended">{course.attended}/{course.total_lessons} attended</span>
                    <span className="stat-remaining">{course.upcoming} remaining</span>
                  </div>
                </>
              ) : (
                <div className="progress-stats">
                  <span className="stat-remaining">Ongoing</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-actions">
          <button className="add-btn" onClick={() => setShowAddCourse(true)}>+ Course</button>
          <button className="add-btn add-btn-secondary" onClick={() => setShowAddEvent(true)}>+ Event</button>
        </div>
      </aside>

      <main className={`main ${mobileTab === 'calendar' ? 'mobile-visible' : ''}`}>
        <CalendarView
          events={visibleEvents}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelect={handleSelect}
          onDateClick={handleDateClick}
        />
      </main>

      {showChoice && (
        <SlotChoiceModal
          onClose={() => { setShowChoice(false); setClickedSlot(null) }}
          onAddCourse={() => { setShowChoice(false); setShowAddCourse(true) }}
          onAddEvent={() => { setShowChoice(false); setShowAddEvent(true) }}
        />
      )}

      {showAddCourse && (
        <AddCourseModal
          colors={COURSE_COLORS}
          people={people}
          defaultPersonId={defaultPersonId}
          onClose={() => { setShowAddCourse(false); setClickedSlot(null) }}
          onSubmit={handleAddCourse}
          initialDate={clickedSlot?.date}
          initialTime={clickedSlot?.startTime}
          initialEndTime={clickedSlot?.endTime}
        />
      )}

      {showAddEvent && (
        <AddEventModal
          colors={COURSE_COLORS}
          people={people}
          defaultPersonId={defaultPersonId}
          onClose={() => { setShowAddEvent(false); setClickedSlot(null) }}
          onSubmit={handleAddEvent}
          initialDate={clickedSlot?.date}
          initialTime={clickedSlot?.startTime}
          initialEndTime={clickedSlot?.endTime}
          initialAllDay={clickedSlot?.allDay}
        />
      )}

      {showEditEvent && editingEvent && (
        <EditEventModal
          event={editingEvent}
          colors={COURSE_COLORS}
          people={people}
          onClose={() => { setShowEditEvent(false); setEditingEvent(null) }}
          onSubmit={handleEditEvent}
        />
      )}

      {showEditCourse && editingCourse && (
        <EditCourseModal
          course={editingCourse}
          colors={COURSE_COLORS}
          people={people}
          onClose={() => { setShowEditCourse(false); setEditingCourse(null) }}
          onSubmit={handleEditCourse}
        />
      )}

      {showManagePeople && (
        <ManagePeopleModal
          people={people}
          selectedPeople={selectedPeople}
          colors={COURSE_COLORS}
          onToggle={togglePerson}
          onAdd={handleAddPerson}
          onUpdate={handleUpdatePerson}
          onDelete={handleDeletePerson}
          onClose={() => setShowManagePeople(false)}
        />
      )}

      {showLessonScope && (
        <LessonScopeModal
          action={lessonScopeAction}
          onOne={() => handleScopeChoice('one')}
          onFuture={() => handleScopeChoice('future')}
          onCancel={() => handleScopeChoice(null)}
        />
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteEvent}
          onEdit={(ev) => { setEditingEvent(ev); setShowEditEvent(true); setSelectedEvent(null) }}
          onSaveNotes={handleSaveNotes}
          onReschedule={handleLessonReschedule}
        />
      )}
    </div>
  )
}
