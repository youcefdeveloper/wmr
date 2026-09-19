import React from 'react'
import { paging, updateQueryParams } from '@utils/common.ts'


export type FilterRatesMeta = {
  fromPage: number
  page: number
  itemsPerPage: number
  toPage: number
  totalPages: number
  totalItems: number
} | null

type PaginationProps = {
  prevNext?: boolean
  theme?: 'default' | 'dropdown'
  filterMeta: FilterRatesMeta
}

export default function Pagination({
                                     prevNext = true,
                                     theme = 'default',
                                     filterMeta = null
                                   }: PaginationProps) {
  const handlePageNavigation = (page: any, e: any) => {
    e.preventDefault();
    updateQueryParams({ page: String(page) });
  }
  const handlePageChange = (page: any, e: any) => {
    e.preventDefault();
    updateQueryParams({ page: String(page) });
  }

  return (
    // searchPatientMeta?.totalPages! > 1 && (
    <div className="mt-0 mb-4 mt-lg-0 mb-lg-2 paging">
      {theme === 'default' ? (
        <div className="d-flex justify-content-center align-items-center">
          <div className="fs-14 d-none">
            <span className="me-1">Showing</span>
            <span className="fw-semibold">{filterMeta?.fromPage}</span> to{' '}
            <span className="fw-semibold">{filterMeta?.toPage} </span>
            of <span className="fw-semibold">{filterMeta?.totalItems}</span>
            <span className="ms-1">patients</span>
          </div>
          <div className="d-none d-md-block">
            <div className="d-flex justify-content-end align-items-center">
              <nav>
                <ul className="pagination mb-0">
                  {prevNext && (
                    <li
                      className={`page-item page-prev ${
                        filterMeta?.page === 1 ? 'disabled' : ''
                      }`}
                    >
                      {filterMeta?.page === 1 ? (
                        <span className="page-link">
                          <i className="bi bi-chevron-left nav-arrow"></i>
                        </span>
                      ) : (
                        <a
                          className="page-link"
                          href={`#${filterMeta?.page! - 1}`}
                          onClick={(e) =>
                            handlePageNavigation(filterMeta?.page! - 1, e)
                          }
                          title="Previous Page"
                        >
                          <i className="bi bi-chevron-left nav-arrow"></i>
                        </a>
                      )}
                    </li>
                  )}
                  {/* previous */}

                  {paging(filterMeta?.page!, filterMeta?.totalPages!).map(
                    (p, i) =>
                      p === '...' ? (
                        <li
                          className="page-item page-item-dots disabled"
                          key={i}
                        >
                          <span className="page-link">...</span>
                        </li>
                      ) : (
                        <li
                          className={`page-item ${
                            p === filterMeta?.page ? 'active' : ''
                          }`}
                          key={i}
                        >
                          <a
                            className="page-link"
                            href={`#${p}`}
                            onClick={(e) => handlePageNavigation(p, e)}
                            title={`Page ${p}`}
                          >
                            {p}
                          </a>
                        </li>
                      )
                  )}

                  {prevNext && (
                    <li
                      className={`page-item page-next ${
                        filterMeta?.page === filterMeta?.totalPages
                          ? 'disabled'
                          : ''
                      }`}
                    >
                      {filterMeta?.page === filterMeta?.totalPages ? (
                        <span className="page-link">
                          <i className="bi bi-chevron-right nav-arrow"></i>
                        </span>
                      ) : (
                        <a
                          className="page-link me-0"
                          href={`#${filterMeta?.page! + 1}`}
                          onClick={(e) =>
                            handlePageNavigation(filterMeta?.page! + 1, e)
                          }
                          title="Next Page"
                        >
                          <i className="bi bi-chevron-right nav-arrow"></i>
                        </a>
                      )}
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center">
            {prevNext && (
              <div>
                <button
                  className={`btn btn-outline-dark btn-hover ${
                    filterMeta?.page === 1 ? 'disabled' : ''
                  }`}
                  title="Previous Page"
                  onClick={(e) => {
                    filterMeta?.page !== 1 &&
                    handlePageNavigation(filterMeta?.page! - 1, e)
                  }}
                >
                  <i className="bi bi-chevron-left nav-arrow"></i>
                  <span className="ms-1 d-none d-sm-inline-block">Prev</span>
                </button>
              </div>
            )}
            {/* previous */}

            <div className="mx-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="px-2 d-none d-sm-block">Page</div>
                <div className="border-1">
                  {filterMeta?.totalPages && <select
                    className="form-select form-select select-filterr w-100 number-font"
                    value={filterMeta?.page}
                    onChange={(e) => {
                      handlePageChange(parseInt(e.target.value, 10), e)
                    }}>
                    {Array.from({ length: filterMeta?.totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>}
                </div>
                <div className="ps-2">of</div>
                <div className="px-2">{filterMeta?.totalPages}</div>
              </div>
            </div>

            {prevNext && (
              <div>
                <button
                  className={`btn btn-outline-dark btn-hover ${
                    filterMeta?.page === filterMeta?.totalPages ? 'disabled' : ''
                  }`}
                  title="Next Page"
                  onClick={(e) => {
                    filterMeta?.page !== filterMeta?.totalPages &&
                    handlePageNavigation(filterMeta?.page! + 1, e)
                  }}
                >
                  <span className="me-1 d-none d-sm-inline-block">Next</span>
                  <i className="bi bi-chevron-right nav-arrow"></i>
                </button>
              </div>
            )}
            {/* next */}
          </div>
        </>
      )}
    </div>
    // )
  )
}
