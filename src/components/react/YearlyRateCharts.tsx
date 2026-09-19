import lang from '@lang/lang.json'

import { useEffect, useState } from 'react'
import type { YeahlyAvgRates } from '@api-v1-types/index'
import { useThemeStore } from '@stores/theme.store'
import YearlyAvgLineChart from './YearlyAvgLineChart'
import YearlyAvgBarChart from './YearlyAvgBarChart'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

type YearlyRateChartsProps = {
  yearlyAvgRates: YeahlyAvgRates[]
  selectedYear: number
  firstYear: number
  lastYear: number
}

const YearlyRateCharts = ({
  yearlyAvgRates,
  selectedYear,
  firstYear,
  lastYear,
}: YearlyRateChartsProps) => {
  const [chartKey, setChartKey] = useState(0)
  const [yearlyAvgChartType, setYearlyAvgChartType] = useState<
    'line' | 'column'
  >('line')
  const { theme } = useThemeStore()
  const [_, setYear] = useState(selectedYear || '')

  const {
    isYearlyAvgRatesDrawerOpen,
    setIsYearlyAvgRatesDrawerOpen,
    lang: currentLang,
  } = useMortgageCalculatorStore()

  useEffect(() => {
    // const chart = document.querySelector(
    //   '#collapseYearlyAvgRates .chart',
    // ) as HTMLElement | null
    //
    // if (chart && !isYearlyAvgRatesDrawerOpen) {
    //   chart.style.visibility = 'hidden'
    // }

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
    <>
      <div
        className={`drawer ${!isYearlyAvgRatesDrawerOpen && 'collapsed'}`}
        data-bs-toggle="collapse"
        data-bs-target="#collapseYearlyAvgRates"
        aria-expanded="false"
        aria-controls="collapseYearlyAvgRates"
        role="button"
        id="yearlyAvgRatesTarget"
        onClick={() => {
          // setIsYearlyAvgRatesDrawerOpen(!isYearlyAvgRatesDrawerOpen)
          const newState = !isYearlyAvgRatesDrawerOpen
          setIsYearlyAvgRatesDrawerOpen(newState)

          if (!isYearlyAvgRatesDrawerOpen) {
            setTimeout(() => {
              const el = document.getElementById('yearlyAvgRatesTarget')
              if (el) {
                const yOffset = window.innerWidth >= 768 ? -140 : -120
                const y =
                  el.getBoundingClientRect().top + window.pageYOffset + yOffset

                window.scrollTo({ top: y, behavior: 'smooth' })
              }
            }, 300)
          }
        }}
      >
        <h5
          className="mb-0 ms-1 fw-medium drawer-title"
          dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {lang[currentLang].annualAvgRates.title} (
          <span className="number-font">
            {firstYear}–{lastYear}
          </span>
          )
        </h5>
      </div>

      <div
        className={`collapse mt-5 ${isYearlyAvgRatesDrawerOpen && 'show'}`}
        id="collapseYearlyAvgRates"
      >
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
                  <YearlyAvgLineChart
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
                  <YearlyAvgBarChart
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
    </>
  )
}

export default YearlyRateCharts
