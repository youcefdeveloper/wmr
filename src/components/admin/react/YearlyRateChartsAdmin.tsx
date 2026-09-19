import lang from '@lang/lang.json'

import { useEffect, useState } from 'react'
import type { YeahlyAvgRates } from '@api-v1-types/index.ts'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import YearlyAvgLineChartAdmin from '@components/admin/react/YearlyAvgLineChartAdmin.tsx'
import YearlyAvgBarChartAdmin from '@components/admin/react/YearlyAvgBarChartAdmin.tsx'

type YearlyRateChartsAdminProps = {
  yearlyAvgRates: YeahlyAvgRates[]
  selectedYear: number
  firstYear: number
  lastYear: number
}

const YearlyRateChartsAdmin = ({
                                 yearlyAvgRates,
                                 selectedYear,
                                 firstYear,
                                 lastYear,
                               }: YearlyRateChartsAdminProps) => {
  const [chartKey, setChartKey] = useState(0)
  const [yearlyAvgChartType, setYearlyAvgChartType] = useState<
    'line' | 'column'
  >('line')
  const { theme } = useAdminThemeStore()
  const [_, setYear] = useState(selectedYear || '')

  const currentLang = 'en'

  useEffect(() => {
    const handleShown = () => {
      setChartKey((prev) => prev + 1)
      setTimeout(() => {
        const el = document.querySelector(
          '#collapseYearlyAvgRates .chart',
        ) as HTMLElement | null
        if (el) el.style.visibility = 'visible'
      }, 0)
    }

    const collapse = document.getElementById('collapseYearlyAvgRates')
    collapse?.addEventListener('shown.bs.collapse', handleShown)

    return () => {
      collapse?.removeEventListener('shown.bs.collapse', handleShown)
    }
  }, [])

  return (
    <div>
      <div className="row mb-3">
        <div className="col-12 ms-1">
          <div className="d-flex justify-content-start gap-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="yearlyAvgChartType"
                id="yearlyAvgLineChart"
                checked={yearlyAvgChartType === 'line'}
                onChange={() => setYearlyAvgChartType('line')}
              />
              <label
                className="form-check-label ms-1"
                htmlFor="yearlyAvgLineChart"
              >
                {lang[currentLang].annualAvgRates.lineChart}
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="yearlyAvgChartType"
                id="yearlyAvgColumnChart"
                checked={yearlyAvgChartType === 'column'}
                onChange={() => setYearlyAvgChartType('column')}
              />
              <label
                className="form-check-label ms-1"
                htmlFor="yearlyAvgColumnChart"
              >
                {lang[currentLang].annualAvgRates.columnChart}
              </label>
            </div>
          </div>
        </div>
      </div>
      {yearlyAvgChartType === 'line' ? (
        <div className="row">
          <div className="col-md-12 chart">
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ minWidth: '900px', paddingBottom: '0' }}>
                <YearlyAvgLineChartAdmin
                  key={chartKey}
                  rates={yearlyAvgRates}
                  theme={theme}
                  firstYear={firstYear}
                  lastYear={lastYear}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-12 chart">
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ minWidth: '900px', paddingBottom: '0' }}>
                <YearlyAvgBarChartAdmin
                  key={chartKey}
                  rates={yearlyAvgRates}
                  theme={theme}
                  firstYear={firstYear}
                  lastYear={lastYear}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default YearlyRateChartsAdmin
