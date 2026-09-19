import React, { useEffect, useState } from 'react'
import type { FilterRate } from '@admin-types/adminTypes.ts'
import { parseQueryParamsRates, updateQueryParams } from '@utils/common.ts'

type CurrentFilterProps = {
  filter?: FilterRate
}

function CurrentFilter({ filter }: CurrentFilterProps) {
  const [currentFilter, setCurrentFilter] = useState<FilterRate | undefined>(filter)

  // Sync with URL on browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentFilter(parseQueryParamsRates(window.location.search) as FilterRate)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Keep updated when parent filter changes
  useEffect(() => {
    setCurrentFilter(filter)
  }, [filter])

  if (!currentFilter) return null

  const badges: React.JSX.Element[] = []

  // Helper: Remove one key from the URL without clearing the rest
  const removeFilter = (key: keyof FilterRate) => {
    updateQueryParams({ [key]: null, page: '' })
  }

  // Page
  if (currentFilter.page && currentFilter.page !== 1) {
    badges.push(
      <small
        key="page"
        className="btn btn-sm btn-filter cursor-pointer"
        onClick={() => removeFilter('page')}
      >
        Page: {currentFilter.page}
      </small>,
    )
  }

  // Size
  if (currentFilter.size && currentFilter.size !== 10) {
    badges.push(
      <small
        key="size"
        className="btn btn-sm btn-filter cursor-pointer"
        onClick={() => removeFilter('size')}
      >
        Size: {currentFilter.size}
      </small>,
    )
  }

  // Order
  if (currentFilter.order) {
    const order = currentFilter.order.toUpperCase()
    if (order === 'ASC' || order === 'DESC') {
      badges.push(
        <small
          key="order"
          className="btn btn-sm btn-filter cursor-pointer"
          onClick={() => removeFilter('order')}
        >
          Order: {order}
        </small>,
      )
    }
  }

  // Sort
  if (currentFilter.sort) {
    const sort = currentFilter.sort.toLowerCase()
    badges.push(
      <small
        key="sort"
        className="btn btn-sm btn-filter cursor-pointer text-capitalize"
        onClick={() => removeFilter('sort')}
      >
        Sort: {sort}
      </small>,
    )
  }

  // Date range
  if (currentFilter.start && currentFilter.start !== '') {
    const startDateObj = new Date(currentFilter.start + 'T12:00:00')
    let endDateObj: Date

    if (currentFilter.end && currentFilter.end !== '') {
      endDateObj = new Date(currentFilter.end + 'T12:00:00')
    } else {
      endDateObj = new Date()
    }

    if (startDateObj <= endDateObj) {
      const startDate = startDateObj.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      const endDate = endDateObj.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      badges.push(
        <small
          key="date"
          className="btn btn-sm btn-filter cursor-pointer"
          onClick={() => {
            removeFilter('start')
            removeFilter('end')
          }}
        >
          {startDate} - {endDate}
        </small>,
      )
    }
  }

  // Source
  if (currentFilter.source) {
    const source = currentFilter.source.toLowerCase()
    badges.push(
      <small
        key="source"
        className="btn btn-sm btn-filter cursor-pointer text-capitalize"
        onClick={() => removeFilter('source')}
      >
        Source: {source}
      </small>,
    )
  }

  if (badges.length === 0) return null

  return <div className="mt-4 mb-2 flex flex-wrap gap-2-">{badges}</div>
}

export default CurrentFilter
