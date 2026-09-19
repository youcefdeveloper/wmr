import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResultsSummary from '@components/admin/react/rates/ResultsSummary.tsx'
import RatesFilters from '@components/admin/react/rates/RatesFilters.tsx'
import CurrentFilter from '@components/admin/react/rates/CurrentFilter.tsx'
import Pagination from '@components/admin/react/Pagination'
import { client } from '@config/client'
import { formatDateWithWeekday, parseQueryParamsRates, updateQueryParams } from '@utils/common.ts'
import type { FilterRate } from '@admin-types/adminTypes.ts'
import { useAdminThemeStore } from '@stores/admin/theme.store';
import ImportRateModal from './ImportRateModal';


type Rate = {
  id: number,
  week: string,
  us30_yr_frm: number | null,
  us15_yr_frm: number | null,
  source: 'auto' | 'manual',
}

type RatesGridProps = {
  filter: FilterRate
  date: string
  role?: 'superadmin' | 'admin' | 'user'
}

function RatesGrid({ filter, date, role }: RatesGridProps) {
  const theme = useAdminThemeStore(state => state.theme)

  // Add Rate Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRate, setNewRate] = useState({
    week: '',
    us30YrFrm: '',
    us15YrFrm: '',
  })
  const [notifyAdd, setNotifyAdd] = useState(false)
  // Delete Rate Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteRateId, setDeleteRateId] = useState<number | null>(null)

  // Edit Rate Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [editFields, setEditFields] = useState({
    week: '',
    us30YrFrm: '',
    us15YrFrm: '',
  })
  const [rates, setRates] = useState<Rate[]>([])
  const [meta, setMeta] = useState({
    fromPage: 0,
    toPage: 0,
    page: 1,
    itemsPerPage: 10,
    totalPages: 0,
    totalItems: 0,
  })
  const [currentFilter, setCurrentFilter] = useState<FilterRate>(filter)
  const [loading, setLoading] = useState(true)

  const fetchRates = async () => {
    try {
      setLoading(true) // start loading
      const query = window.location.search
      const res = await client.get(`/api/v1/us-weekly-data/paging${query}`)
      if (res.status === 200 && res.data) {
        const { data, ...meta } = res.data
        setRates(data)
        setMeta({
          fromPage: meta.from,
          toPage: meta.to,
          page: meta.page,
          itemsPerPage: meta.size,
          totalPages: meta.pages,
          totalItems: meta.total,
        })
        setCurrentFilter(parseQueryParamsRates(query))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false) // end loading
    }
  }

  useEffect(() => {
    fetchRates()
    const handlePopState = () => fetchRates()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const clearAllFilters = () => {
    updateQueryParams({}, true)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const queryParams = new URLSearchParams(window.location.search)
  const pageParam = queryParams.get('page') || '1'
  const sizeParam = queryParams.get('size') || '10'
  const showClearButton =
    window.location.search &&
    (pageParam !== '1' ||
      sizeParam !== '10' ||
      queryParams.get('sort') ||
      queryParams.get('order') ||
      queryParams.get('start') ||
      queryParams.get('end'))

  const handleOrderChange = (e: any) => {
    e.preventDefault()
    const currentOrder = queryParams.get('order') // get current sort order

    // ✅ CHANGE: start with DESC if undefined, then toggle
    const newOrder = currentOrder ? (currentOrder === 'asc' ? 'desc' : 'asc') : 'desc'

    updateQueryParams({ order: newOrder, page: '', sort: '' })
  }

  if (loading) return <div className="d-flex justify-content-center py-5">
    <div className="spinner" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>

  // Add Rate handler
  const handleAddRate = async () => {
    try {
      await client.post('/api/v1/us-weekly-data-manual', {
        week: newRate.week,
        us30YrFrm: parseFloat(newRate.us30YrFrm),
        us15YrFrm: parseFloat(newRate.us15YrFrm),
      }, {
        headers: {
          'X-API-KEY': import.meta.env.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL,
          'Content-Type': 'application/json',
        },
      })
      // Push notification if checked
      if (notifyAdd) {
        const weekDate = new Date(newRate.week)
        const subtitle = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const body = `30 Yr. Fixed: ${parseFloat(newRate.us30YrFrm).toFixed(2)}% | 15 Yr. Fixed: ${parseFloat(newRate.us15YrFrm).toFixed(2)}%`
        try {
          await client.post('/api/v1/push-notification', {
            title: 'U.S. Weekly Average',
            subtitle,
            body,
          }, {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err: any) {
          toast.error('Failed to send push notification')
        }
      }
      setShowAddModal(false)
      setNewRate({ week: '', us30YrFrm: '', us15YrFrm: '' })
      setNotifyAdd(false)
      fetchRates()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add rate')
    }
  }

  // Edit Rate modal open
  const openEditModal = (rate: Rate) => {
    setEditingRate(rate)
    setEditFields({
      week: rate.week,
      us30YrFrm: rate.us30_yr_frm?.toString() ?? '',
      us15YrFrm: rate.us15_yr_frm?.toString() ?? '',
    })
    setShowEditModal(true)
  }

  // Edit Rate handler
  const handleEditRate = async () => {
    if (!editingRate) return
    try {
      await client.put(`/api/v1/us-weekly-data-manual/${editingRate.id}`,
        {
          week: editFields.week,
          us30YrFrm: parseFloat(editFields.us30YrFrm),
          us15YrFrm: parseFloat(editFields.us15YrFrm),
        },
        {
          headers: {
            'X-API-KEY': import.meta.env.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL,
            'Content-Type': 'application/json',
          },
        }
      )
      setShowEditModal(false)
      setEditingRate(null)
      fetchRates()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update rate')
    }
  }

  return !loading && (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={theme === 'dark' ? 'dark' : 'light'} />
      <div className="row">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center gap-4 order-1 mb-5 flex-wrap">
            <h4 className="fw-bold mb-0">Rates ({meta.totalItems})</h4>
            {role !== 'user' && <div className="d-flex justify-content-end gap-2">
              <button 
                className="btn btn-outline-danger text-danger btn-danger-hover" 
                onClick={() => {}}
                data-bs-toggle="modal" data-bs-target="#importRates">
                <i className={`bi bi-upload me-2 danger-icon`}></i>Import Rates
              </button>
              <button className="btn btn-outline-dark" onClick={() => setShowAddModal(true)}>
                <i className={`bi bi-plus-lg position-relative`} style={{top: 1, marginRight: 5}}></i>New Rate
              </button>
            </div>
            }
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className={`d-flex align-items-lg-center justify-content-md-end justify-content-between`}>
            <div className="small mb-1 d-md-none" style={{ marginLeft: 2 }}>
              <div className="d-flex justify-content-start align-items-center gap-1">
                <i className="bi bi-funnel" style={{ fontSize: 13 }}></i>
                <span>Filter(s)</span>
              </div>
            </div>
            {showClearButton && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-link btn-clear p-0 d-flex align-items-center"
              >
                <i
                  className="bi bi-x-lg"
                  style={{ fontSize: 13, top: -2, right: 2, position: 'relative' }}
                ></i>
                <span className="small mb-1" style={{ marginRight: 2 }}>
                  Clear
                </span>
              </button>
            )}
          </div>

          <div className="d-lg-flex justify-content-lg-between align-items-lg-center gap-3 mx-0 mb-3">
            <div className="w-md-100 w-15 order-2 mb-4 mb-lg-0">
              <RatesFilters />
            </div>
            {meta.totalItems > 0 ? (
              <div className="d-flex justify-content-start gap-4 mt-md-0 mt-4 mb-4 mb-md-0 order-1">
                <ResultsSummary
                  fromPage={meta.fromPage}
                  toPage={meta.toPage}
                  totalItems={meta.totalItems}
                />
              </div>
            ) : (<div></div>)}
          </div>

          <CurrentFilter filter={currentFilter} />
        </div>
      </div>

      {meta.totalItems > 0 ? (
        <div className="card card-table">
          <div className="card-body table-responsive-md">
            <table className="table table-striped mb-0" style={{ minWidth: 600 }}>
              <thead>
              <tr>
                <th>#</th>
                <th>30 Yr. Fixed</th>
                <th>15 Yr. Fixed</th>
                <th>
                  <a
                    href="/"
                    className="d-flex justify-content-start align-items-center gap-1"
                    onClick={handleOrderChange}
                    order-data={queryParams.get('order') === 'asc' ? 'asc' : 'desc'}
                  >
                    <span className="fw-bold">Date</span>
                    {currentFilter?.order ? (
                      <i
                        className={`ms-1 bi bi-arrow-${queryParams.get('order') === 'asc' ? 'up' : 'down'}`}></i>
                    ) : (
                      <i className={`ms-1 bi bi-arrow-down-up opacity-25`}></i>
                    )}
                  </a>
                </th>
                <th>Source</th>
                <th>Action(s)</th>
              </tr>
              </thead>
              <tbody>
              {rates.map((rate: Rate) => (
                <tr key={rate.id}>
                  <td className={`small ${rate.source === 'manual' ? 'text-danger' : ''}`}>{rate.id}</td>
                  <td className={`small ${rate.source === 'manual' ? 'text-danger' : ''}`}>{rate.us30_yr_frm?.toFixed(2) ?? 'N/A'}</td>
                  <td className={`small ${rate.source === 'manual' ? 'text-danger' : ''}`}>{rate.us15_yr_frm?.toFixed(2) ?? 'N/A'}</td>
                  <td className={`small ${rate.source === 'manual' ? 'text-danger' : ''}`}>{formatDateWithWeekday(rate.week)}</td>
                  <td className={`small text-capitalize ${rate.source === 'manual' ? 'text-danger' : ''}`}>{rate.source}</td>
                  <td className={`small ${rate.source === 'manual' ? 'text-danger' : ''}`}>
                    {role === 'user' || rate.source === 'auto' ? 
                      <i className="bi bi-pen me-2 opacity-25"></i> : (
                      <a href="#"
                        className="me-2"
                        title="edit"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(rate);
                        }}
                      >
                        <i className="bi bi-pen text-danger"></i>
                      </a>
                    )}
                    {role === 'user' || rate.source === 'auto' ? 
                      <i className="bi bi-trash opacity-25"></i> : (    
                      <a
                        href="#"
                        title="delete"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteRateId(rate.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="d-flex justify-content-center py-5">
          <p className="lead fw-light">No rates found.</p>
        </div>
      )}

      {meta.totalItems > 0 && (
        <div className="mt-4">
          <ResultsSummary fromPage={meta.fromPage} toPage={meta.toPage} totalItems={meta.totalItems} />
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

      {/* Add Rate Modal */}
      {showAddModal && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Add New Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowAddModal(false)}}></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_30YrFixed">30 Yr. Fixed</label>
                    <div className="field-group">
                      <input type="number" placeholder="6.27" step="0.01" id="_30YrFixed" className="form-control form-control-lg" value={newRate.us30YrFrm} onChange={e => setNewRate({...newRate, us30YrFrm: e.target.value})} />
                      <span className="field-group-end">%</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_15YrFixed">15 Yr. Fixed</label>
                    <div className="field-group">
                      <input type="number" placeholder="5.34" step="0.01" id="_15YrFixed" className="form-control form-control-lg" value={newRate.us15YrFrm} onChange={e => setNewRate({...newRate, us15YrFrm: e.target.value})} />
                      <span className="field-group-end">%</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_week">Week</label>
                    <div className="date-wrapper date-wrapper-lg">
                      <input type="date" id="week" className="form-control form-control-lg" value={newRate.week} onChange={e => setNewRate({...newRate, week: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex flex-column align-items-start gap-3">
                  <div className="form-check mt-5">
                    <input
                      className="form-check-input"
                      id="notifySubscribers"
                      type="checkbox"
                      checked={notifyAdd}
                      onChange={e => setNotifyAdd(e.target.checked)}
                    />
                    <label className="form-check-label ps-1 me-3" htmlFor="notifySubscribers">Notify Subscribers</label>
                  </div>
                  <div className="d-flex justify-content-start gap-1 m-0">
                    <button type="button" className="btn btn-lg btn-modal fw-light m-0" onClick={handleAddRate} disabled={!newRate.week || !newRate.us30YrFrm || !newRate.us15YrFrm}>Add</button>
                    <button type="button" className="btn btn-lg btn-transparent fw-light m-0" onClick={() => setShowAddModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Edit Rate Modal */}
      {showEditModal && editingRate && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Edit Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowEditModal(false); setEditingRate(null)}}></a>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_30YrFixed">30 Yr. Fixed</label>
                    <input type="number" step="0.01" id="_30YrFixed" className="form-control form-control-lg" value={editFields.us30YrFrm} onChange={e => setEditFields({...editFields, us30YrFrm: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_15YrFixed">15 Yr. Fixed</label>
                    <input type="number" step="0.01" id="_15YrFixed" className="form-control form-control-lg" value={editFields.us15YrFrm} onChange={e => setEditFields({...editFields, us15YrFrm: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label mb-0" htmlFor="_week">Week</label>
                    <div className="date-wrapper date-wrapper-lg">
                      <input type="date" id="_week" className="form-control form-control-lg" value={editFields.week} onChange={e => setEditFields({...editFields, week: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-start gap-1 m-0">
                  <button type="button" className="btn btn-lg btn-modal fw-light m-0" onClick={handleEditRate} disabled={!editFields.week || !editFields.us30YrFrm || !editFields.us15YrFrm}>Save</button>
                  <button type="button" className="btn btn-lg btn-transparent fw-light m-0" onClick={() => {setShowEditModal(false); setEditingRate(null)}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}

      {/* Delete Rate Modal */}
      {showDeleteModal && (
        <>
          <div className="modal modal-alert fade show" tabIndex={-1} style={{ display: 'block' }}>
            <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h1 className="modal-title fs-5 fw-bold mb-0">Delete Rate</h1>
                  <a href="#" className="bi bi-x-lg h4 mb-0" onClick={e => {e.preventDefault(); setShowDeleteModal(false); setDeleteRateId(null)}}></a>
                </div>
                <div className="modal-body">
                  <p className="lead">Are you sure you want to delete this rate?</p>
                </div>
                <div className="modal-footer">
                  <div className="d-flex justify-content-start gap-1 m-0">
                    <button type="button" className="btn btn-lg btn-modal btn-danger fw-light m-0" onClick={async () => {
                      if (!deleteRateId) return;
                      try {
                        await client.delete(`/api/v1/us-weekly-data-manual/${deleteRateId}`, {
                          headers: {
                            'X-API-KEY': import.meta.env.PUBLIC_API_KEY_WEEKLY_DATA_MANUAL,
                          },
                        });
                        setShowDeleteModal(false);
                        setDeleteRateId(null);
                        fetchRates();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.error || 'Failed to delete rate');
                      }
                    }}>Confirm</button>
                    <button type="button" className="btn btn-lg btn-transparent fw-light m-0" onClick={() => {setShowDeleteModal(false); setDeleteRateId(null)}}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <ImportRateModal
        title="Import Rates"
        date={date}
        onClose={() => {
          // Hide modal by removing #importRates from URL and closing Bootstrap modal if needed
          const modal = document.getElementById('importRates');
          if (modal && window.bootstrap) {
            const bsModal = window.bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
          }
        }}
        onReload={fetchRates}
      />
    </>
  )
}

export default RatesGrid
