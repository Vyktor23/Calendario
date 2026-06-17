import { useState, useEffect, useCallback } from 'react'
import type { CalendarEvent } from '../types'

const STORAGE_KEY = 'chronos-events'

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events])

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = { ...event, id: crypto.randomUUID() }
    setEvents(prev => [...prev, newEvent])
    return newEvent
  }, [])

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const getEventsForDate = useCallback((date: string) => {
    return events.filter(e => e.date === date)
  }, [events])

  const getEventsForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return events.filter(e => e.date.startsWith(prefix))
  }, [events])

  return { events, addEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForMonth }
}
