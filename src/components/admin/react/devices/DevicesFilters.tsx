import React, { useEffect, useState } from 'react'
import { parseQueryParams, todayEST, updateQueryParams } from '@utils/common.ts'

function DevicesFilters() {
  const [filter, setFilter] = useState(parseQueryParams(window.location.search))
  const [localStart, setLocalStart] = useState(filter.start || '')
  const [localEnd, setLocalEnd] = useState(filter.end || '')

  // Sync with URL on back/forward
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseQueryParams(window.location.search)
      setFilter(parsed)
      setLocalStart(parsed.start || '')
      setLocalEnd(parsed.end || '')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQueryParams({ size: e.target.value, page: '' })
  }

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQueryParams({ platform: e.target.value === 'all' ? null : e.target.value, page: '' })
  }

  const handleVisitCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQueryParams({ visit: e.target.value === 'all' ? null : e.target.value, page: '' })
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalStart(value)
    setLocalEnd('') // reset end date
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalEnd(value)

    // Only trigger filter when both start & end are selected
    if (localStart && value) {
      updateQueryParams({ start: localStart, end: value, page: '' })
    }
  }

  return (
    <div className="d-lg-flex justify-content-lg-between align-items-lg-end gap-2 mx-0 mb-0">
      {/* Page size */}
      <select className="form-select select-filter-lg number-font mb-2 mb-lg-0" value={filter.size?.toString() || '10'}
              onChange={handleSizeChange}>
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>


      <div className="d-flex justify-content-between align-items-end gap-2 mb-2 mb-lg-0">
        {/* Platform */}
        <select className="form-select select-filter-lg number-font" value={filter.platform || 'all'}
                onChange={handlePlatformChange}>
          <option value="all">All</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>

        {/* Returning */}
        <select className="form-select select-filter-lg number-font" value={filter.visit || 'all'}
                onChange={handleVisitCountChange}>
          <option value="all">All</option>
          <option value="returning">Returning</option>
          <option value="oneTime">One Time</option>
        </select>
      </div>

      {/* Date range */}
      <div className="d-flex justify-content-between align-items-end gap-2 mb-2 mb-lg-0">
        <div className="date-wrapper">
          <input
            type="date"
            className="form-control"
            value={localStart}
            onChange={handleStartChange}
            min="2025-07-01"
            max={todayEST}
          />
        </div>
        <div className="date-wrapper">
          <input
            type="date"
            className="form-control"
            value={localEnd}
            onChange={handleEndChange}
            min={localStart || '2025-07-01'}
            max={todayEST}
            disabled={!localStart} // disabled until start date is selected
          />
        </div>
      </div>
    </div>
  )
}

export default DevicesFilters
