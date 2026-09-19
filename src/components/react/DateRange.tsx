import { useState } from 'react'
import DatePicker from 'react-datepicker'

const DateRange = () => {
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange

  return (
    <DatePicker
      selectsRange={true}
      startDate={startDate}
      endDate={endDate}
      onChange={(update) => {
        setDateRange(update as any)
      }}
      isClearable={true}
    />
  )
}

export default DateRange
