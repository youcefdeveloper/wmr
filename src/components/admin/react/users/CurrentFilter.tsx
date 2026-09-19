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

  // Role
  if (currentFilter.role) {
    badges.push(
      <small key="role" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('role')}>
        Role: {currentFilter.role === 'superadmin' ? 'Superadmin' : currentFilter.role === 'admin' ? 'Admin' : 'User'}
      </small>,
    )
  }

  // Provider
  if (currentFilter.provider) {
    const providerNames: Record<string, string> = {
      google: 'Google',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      microsoft: 'Microsoft',
      apple: 'Apple'
    }
    badges.push(
      <small key="provider" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('provider')}>
        Provider: {providerNames[currentFilter.provider] || currentFilter.provider}
      </small>,
    )
  }

  // Active Status
  if (currentFilter.active !== null && currentFilter.active !== undefined) {
    badges.push(
      <small key="active" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('active')}>
        Status: {currentFilter.active === 1 ? 'Active' : 'Inactive'}
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

  // User Name Order
  if (currentFilter.uOrder) {
    badges.push(
      <small key="uOrder" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('uOrder')}>
        Name Order: {currentFilter.uOrder.toUpperCase()}
      </small>,
    )
  }

  // Email Order
  if (currentFilter.eOrder) {
    badges.push(
      <small key="eOrder" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('eOrder')}>
        Email Order: {currentFilter.eOrder.toUpperCase()}
      </small>,
    )
  }

  // Created Order
  if (currentFilter.cOrder) {
    badges.push(
      <small key="cOrder" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('cOrder')}>
        Created Order: {currentFilter.cOrder.toUpperCase()}
      </small>,
    )
  }

  // Role Order
  if (currentFilter.rOrder) {
    badges.push(
      <small key="rOrder" className="btn btn-sm btn-filter cursor-pointer" onClick={() => removeFilter('rOrder')}>
        Role Order: {currentFilter.rOrder.toUpperCase()}
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
            removeFilter('start')
            removeFilter('end')
          }}
        >
          {startDate} - {endDate}
        </small>,
      )
    }
  }

  if (badges.length === 0) return null
  return <div className="mt-4 mb-2 d-flex flex-wrap gap-2-">{badges}</div>
}

export default CurrentFilter
