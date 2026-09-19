import React, { useMemo, useState } from 'react'

type RateDatePickerProps = {
  baseDate: string
}

const RateDatePicker: React.FC<RateDatePickerProps> = ({ baseDate }) => {
  // Helper: format a Date as YYYY-MM-DD in EST
  const formatInEST = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  const { minDate, maxDate, defaultDate } = useMemo(() => {
    // Parse the input date (baseDate: "YYYY-MM-DD")
    const [year, month, day] = baseDate.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    // Get the day of week in EST (0 = Sun, 6 = Sat)
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
    })
    const weekday = estFormatter.format(date) // e.g. "Tue"
    const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)

    // Find start of current week (Sunday)
    const startOfWeek = new Date(date)
    startOfWeek.setUTCDate(date.getUTCDate() - dayIndex)

    // Compute next week's Sunday → Saturday
    const nextSunday = new Date(startOfWeek)
    nextSunday.setUTCDate(startOfWeek.getUTCDate() + 7)

    const nextSaturday = new Date(nextSunday)
    nextSaturday.setUTCDate(nextSunday.getUTCDate() + 6)

    // Thursday = Sunday + 4 days
    const nextThursday = new Date(nextSunday)
    nextThursday.setUTCDate(nextSunday.getUTCDate() + 4)

    return {
      minDate: formatInEST(nextSunday),
      maxDate: formatInEST(nextSaturday),
      defaultDate: formatInEST(nextThursday),
    }
  }, [baseDate])

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate)

  return (
    <input
      type="date"
      className="form-control form-control-lg"
      id="_date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      min={minDate}
      max={maxDate}
    />
  )
}

export default RateDatePicker
