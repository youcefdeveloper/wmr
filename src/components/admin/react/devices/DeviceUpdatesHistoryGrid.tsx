import React, { useEffect, useState } from 'react'
import ResultsSummary from '@components/admin/react/devices/ResultsSummary.tsx'
import CurrentFilter from '@components/admin/react/devices/CurrentFilter.tsx'
import Pagination from '@components/admin/react/Pagination'
import { client } from '@config/client'
import { formatDateTime, parseQueryParams, updateQueryParams } from '@utils/common.ts'
import type { Filter } from '@admin-types/adminTypes.ts'
import DeviceUpdatesHistoryFilters from '@components/admin/react/devices/DeviceUpdatesHistoryFilters.tsx'

type Device = {
  id: number
  platform: 'ios' | 'android'
  model: number | null
  createdAt: string
  updatedAt: string
  pushTokens: { id: number; createdAt: string; updatedAt: string, updatedAtHistoryCount: number }[],
  ipAddress?: string | null,
  location?: string | null,
  lang?: string | null,
  language?: null
}

type FilterMeta = {
  fromPage: number
  page: number
  itemsPerPage: number
  toPage: number
  totalPages: number
  totalItems: number
}

type DevicesGridProps = {
  fromPage: number
  toPage: number
  totalItems: number
  devices: Device[]
  filter?: Filter
  filterMeta: FilterMeta
  model: string
  platform: 'ios' | 'android'
  userId: number
  createdAt: string
}

function DeviceUpdatesHistoryGrid({
                                    devices,
                                    filter,
                                    filterMeta,
                                    model,
                                    platform,
                                    userId,
                                    createdAt,
                                  }: DevicesGridProps) {
  const [data, setData] = useState(devices)
  const [meta, setMeta] = useState(filterMeta)
  const [currentFilter, setCurrentFilter] = useState(filter)
  const [loading, setLoading] = useState(true)

  // console.log('filter?', filter)
  // console.log('currentFilter?', currentFilter)

  const fetchDevices = async () => {
    try {
      setLoading(true) // start loading
      const query = window.location.search
      const res = await client.get(`/api/v1/users/${userId}/update-history${query}`)

      console.log ('fetchDevices response:', res)

      if (res.status === 200 && res.data) {
        const { userId, deviceId, platform, model, createdAt, filter: filterParams, data, ...meta } = res.data
        setData(data)
        setMeta({
          fromPage: meta.from,
          page: meta.page,
          itemsPerPage: meta.size,
          toPage: meta.to,
          totalPages: meta.pages,
          totalItems: meta.total,
        })
        setCurrentFilter(parseQueryParams(query))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false) // end loading
    }
  }

  useEffect(() => {
    fetchDevices()
    const handlePopState = () => fetchDevices()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const clearAllFilters = () => updateQueryParams({}, true)

  // Determine if Clear button should show
  const queryParams = new URLSearchParams(window.location.search)
  const pageParam = queryParams.get('page') || '1'
  const sizeParam = queryParams.get('size') || '10'
  const showClearButton =
    window.location.search &&
    (pageParam !== '1' ||
      sizeParam !== '10' ||
      queryParams.get('platform') ||
      queryParams.get('model') ||
      queryParams.get('start') ||
      queryParams.get('end') ||
      queryParams.get('order'))

  const handleSort = (type: 'created' | 'updated') => {
    const currentOrder = type === 'created' ? currentFilter?.order : currentFilter?.uOrder

    // If currentOrder is undefined (first click), start with DESC
    const newSortOrder = currentOrder ? (currentOrder === 'asc' ? 'desc' : 'asc') : 'desc'

    if (type === 'created') {
      updateQueryParams({ order: newSortOrder, page: '', uOrder: '' })
    } else {
      updateQueryParams({ uOrder: newSortOrder, page: '', order: '' })
    }
  }

  if (loading) return <div className="d-flex justify-content-center py-5">
    <div className="spinner" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>

  return !loading && (
    <>
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex-- justify-content-between-- align-items-center-- gap-4-- order-1-- mb-5">
            <h4
              className="fw-bold mb-0">{model} ({platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Unknown'})</h4>
            {/*<NewDeviceButton />*/}
            <i className="small fw-light">Joined on {formatDateTime(createdAt)}</i>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex align-items-lg-center justify-content-md-end justify-content-between">
            <div className="small mb-1 d-md-none" style={{ marginLeft: 2 }}>
              <div className="d-flex justify-content-start align-items-center gap-1">
                <i className="bi bi-funnel" style={{ fontSize: 13 }}></i>
                <span>Filter(s)</span>
              </div>
            </div>
            {showClearButton && (
              <button type="button" onClick={clearAllFilters}
                      className="btn btn-link btn-clear p-0 d-flex align-items-center">
                <i className="bi bi-x-lg" style={{ fontSize: 13, top: -2, right: 2, position: 'relative' }}></i>
                <span className="small mb-1" style={{ marginRight: 2 }}>Clear</span>
              </button>
            )}
          </div>

          <div className="d-lg-flex justify-content-lg-between align-items-lg-center gap-3 mx-0 mb-3">
            <div className="w-md-100 w-15 order-2 mb-4 mb-lg-0">
              <DeviceUpdatesHistoryFilters />
            </div>
            {meta.totalItems > 0 ? (
              <div className="d-flex justify-content-start gap-4 mt-lg-0 mt-4 mb-4 mb-lg-0 order-1">
                <ResultsSummary fromPage={meta.fromPage} toPage={meta.toPage} totalItems={meta.totalItems}
                                itemName={'visits'} />
              </div>
            ) : (<div></div>)}
          </div>

          <CurrentFilter filter={currentFilter!} />
        </div>
      </div>

      {meta.totalItems > 0 ? (
        <div className="card card-table">
          <div className="card-body table-responsive-lg">
            <table className="table table-striped mb-0" style={{ minWidth: 800 }}>
              <thead>
              <tr>
                <th>#</th>
                <th>
                  <a
                    href="#"
                    className="d-flex justify-content-start align-items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSort('created')
                    }}
                  >
                    <span className="fw-bold">Returning Date</span>
                    {currentFilter?.order ? (
                      <i className={`ms-1 bi bi-arrow-${currentFilter.order === 'asc' ? 'up' : 'down'}`}></i>
                    ) : (
                      <i className={`ms-1 bi bi-arrow-down-up opacity-25`}></i>
                    )}
                  </a>
                </th>
                <th>Location</th>
                <th>Language</th>
                {/* <th>Action(s)</th> */}
              </tr>
              </thead>
              <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td className="small">{d.id}</td>
                  <td className="small">{formatDateTime(d.updatedAt) ?? 'N/A'}</td>
                  <td className="small">{d.location ?.replace(/united states/i, "USA").replace(/united kingdom/i, "UK")?? "N/A"}</td>
                  <td className="small">{d.language ?? 'N/A'}</td>
                  {/* <td className="small">
                    <a href="#" onClick={(e) => {
                      e.preventDefault()
                    }}>View</a>
                  </td> */}
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="d-flex justify-content-center py-5">
          <p className="lead fw-light">No user updates history found.</p>
        </div>
      )}
      {meta.totalItems > 0 && (
        <div className="mt-4">
          <ResultsSummary fromPage={meta.fromPage} toPage={meta.toPage} totalItems={meta.totalItems}
                          itemName={'visits'} />
        </div>
      )}

      {meta.totalItems > 0 && meta.totalPages > 1 && (
        <>
          <div className="d-md-block d-none my-5">
            <Pagination theme="default" filterMeta={meta} />
          </div>
          <div className="d-md-none my-5">
            <Pagination theme="dropdown" filterMeta={meta} />
          </div>
        </>
      )}
    </>
  )
}

export default DeviceUpdatesHistoryGrid
