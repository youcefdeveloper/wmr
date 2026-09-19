import React, { useEffect, useState } from 'react'
import type { Filter } from '@admin-types/adminTypes.ts'
import { parseQueryParams, updateQueryParams } from '@utils/common.ts'

type CurrentFilterProps = {
  filter?: Filter
}

function CurrentFilter({ filter }: CurrentFilterProps) {
  const [currentFilter, setCurrentFilter] = useState<Filter | undefined>(filter)

  // Sync with URL on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentFilter(parseQueryParams(window.location.search))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    setCurrentFilter(filter)
  }, [filter])

  if (!currentFilter) return null

  const badges: React.JSX.Element[] = []

  const removeFilter = (key: keyof Filter) => {
    updateQueryParams({ [key]: null, page: '' })
  }

  // Platform
  if (currentFilter.platform) {
    badges.push(
      <small key="platform" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('platform')}>
        Platform: {currentFilter.platform === 'ios' ? 'iOS' : currentFilter.platform === 'android' ? 'Android' : 'All'}
      </small>,
    )
  }

  // Model
  if (currentFilter.model) {
    badges.push(
      <small key="model" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('model')}>
        Model: {currentFilter.model}
      </small>,
    )
  }

  // Page
  if (currentFilter.page && currentFilter.page !== 1) {
    badges.push(
      <small key="page" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('page')}>
        Page: {currentFilter.page}
      </small>,
    )
  }

  // Size
  if (currentFilter.size && currentFilter.size !== 10) {
    badges.push(
      <small key="size" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('size')}>
        Size: {currentFilter.size}
      </small>,
    )
  }

  // Created Order
  if (currentFilter.order) {
    badges.push(
      <small key="order" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('order')}>
        Added At Order: {currentFilter.order.toUpperCase()}
      </small>,
    )
  }

  // Updated Order
  if (currentFilter.uOrder) {
    badges.push(
      <small key="order" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('uOrder')}>
        Opened At Order: {currentFilter.uOrder.toUpperCase()}
      </small>,
    )
  }

  // Visit Order
  if (currentFilter.vOrder) {
    badges.push(
      <small key="order" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('vOrder')}>
        Visit Order: {currentFilter.vOrder.toUpperCase()}
      </small>,
    )
  }

  // Date range
  if (currentFilter.start) {
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
            // SPA-friendly removal
            removeFilter('start')
            removeFilter('end')
          }}
        >
          {startDate} - {endDate}
        </small>,
      )
    }
  }

  // Visit
  if (currentFilter.visit) {
    badges.push(
      <small key="visit" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('visit')}>
        Visit: {currentFilter.visit === 'returning' ? 'Returning' : currentFilter.visit === 'oneTime' ? 'One Time' : 'All'}
      </small>,
    )
  }

  // Visit By
  if (currentFilter.visitBy) {
    badges.push(
      <small key="visitBy" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('visitBy')}>
        Visit By: {currentFilter.visitBy === 'today' ? 'Today so far' : currentFilter.visitBy === 'yesterday' ? 'Yesterday' : currentFilter.visitBy === 'last_week' ? 'Last 7 days' : 'All Time'}
      </small>,
    )
  }

  if (badges.length === 0) return null
  return <div className="mt-4 mb-2 flex flex-wrap gap-2-">{badges}</div>
}

export default CurrentFilter
