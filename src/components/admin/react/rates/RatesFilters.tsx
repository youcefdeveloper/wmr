import React, { useState } from 'react'
import { todayEST, updateQueryParams } from '@utils/common.ts'

function RatesFilters() {
  const params = new URLSearchParams(window.location.search)
  const initialStart = params.get('start') || ''
  const initialEnd = params.get('end') || ''

  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)

  const handleStartChange = (e: any) => {
    const value = e.target.value
    setStartDate(value)
    setEndDate('')
  }

  const handleEndChange = (e: any) => {
    setEndDate(e.target.value)
    updateQueryParams({ start: startDate, end: e.target.value, page: '' })
  }

  return (
    <div className="d-lg-flex justify-content-lg-between align-items-lg-end gap-2 mx-0 mb-0">
      <select
        className="form-select select-filter-lg number-font mb-2 mb-lg-0"
        defaultValue={params.get('size') || '10'}
        onChange={(e) => updateQueryParams({ size: e.target.value, page: '' })}
      >
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>

      <div className="d-flex justify-content-between align-items-end gap-2 mb-2 mb-lg-0">
        <select
          className="form-select select-filter-lg number-font mb-2 mb-lg-0"
          defaultValue={params.get('source') || ''}
          onChange={(e) => updateQueryParams({ source: e.target.value, page: '' })}
        >
          <option value="">All</option>
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
        <select
          className="form-select select-filter-lg number-font mb-2 mb-lg-0"
          defaultValue={params.get('sort') || 'newest'}
          onChange={(e) => updateQueryParams({ sort: e.target.value, page: '', order: '' })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="lowest">Lowest</option>
          <option value="highest">Highest</option>
        </select>
      </div>
      
      <div className="d-flex justify-content-between align-items-end gap-2 mb-2 mb-lg-0">
        <div className="date-wrapper">
          <input
            type="date"
            value={startDate}
            onChange={handleStartChange}
            className="form-control"
            placeholder="Start date"
            min={'1971-04-01'}
            max={todayEST}
          />
        </div>
        <div className="date-wrapper">
          <input
            type="date"
            value={endDate}
            onChange={handleEndChange}
            disabled={!startDate}
            min={startDate}
            className="form-control"
            placeholder="End date"
            max={todayEST}
          />
        </div>
      </div>
    </div>
  )
}

export default RatesFilters
