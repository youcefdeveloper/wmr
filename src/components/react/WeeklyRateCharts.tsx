import lang from '@lang/lang.json'

import { useEffect, useState, type ChangeEvent } from 'react'
import BarChart from './BarChart'
import LineChart from './LineChart'
import type { Rates } from '@api-v1-types/index'
import { useThemeStore } from '@stores/theme.store'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

type WeeklyRateChartsProps = {
  yearlyRates: Rates[]
  selectedYear: number
  numberOfWeeks: number
  years: any
}

const WeeklyRateCharts = ({
  yearlyRates,
  selectedYear,
  numberOfWeeks,
  years,
}: WeeklyRateChartsProps) => {
  const [chartKey, setChartKey] = useState(0)
  const [chartType, setChartType] = useState<'line' | 'column'>('line')
  const { theme } = useThemeStore()
  const [_, setYear] = useState(selectedYear || '')

  const {
    isWeeklyRatesDrawerOpen,
    setIsWeeklyRatesDrawerOpen,
    lang: currentLang,
  } = useMortgageCalculatorStore()

  const handleSelectYear = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    setYear(selected)

    window.location.search = `?year=${selected}`
  }

  useEffect(() => {
    // const chart = document.querySelector(
    //   '#collapseWeeklyRates .chart',
    // ) as HTMLElement | null
    //
    // if (chart && !isWeeklyRatesDrawerOpen) {
    //   chart.style.visibility = 'hidden'
    // }

    const handleShown = () => {
      setChartKey((prev) => prev + 1)
      setTimeout(() => {
        const el = document.querySelector(
          '#collapseWeeklyRates .chart',
        ) as HTMLElement | null
        if (el) el.style.visibility = 'visible'
      }, 0)
    }

    const collapse = document.getElementById('collapseWeeklyRates')
    collapse?.addEventListener('shown.bs.collapse', handleShown)

    return () => {
      collapse?.removeEventListener('shown.bs.collapse', handleShown)
    }
  }, [])

  return (
    <>
      <div
        className={`drawer ${!isWeeklyRatesDrawerOpen && 'collapsed'}`}
        data-bs-toggle="collapse"
        data-bs-target="#collapseWeeklyRates"
        aria-expanded="false"
        aria-controls="collapseWeeklyRates"
        role="button"
        id="weeklyRatesTarget"
        onClick={() => {
          // setIsWeeklyRatesDrawerOpen(!isWeeklyRatesDrawerOpen)
          const newState = !isWeeklyRatesDrawerOpen
          setIsWeeklyRatesDrawerOpen(newState)

          if (!isWeeklyRatesDrawerOpen) {
            setTimeout(() => {
              const el = document.getElementById('weeklyRatesTarget')
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
          {lang[currentLang].weeklyRates.title}{' '}
          <span className="number-font">{selectedYear}</span>
        </h5>
      </div>
      <div
        className={`collapse ${isWeeklyRatesDrawerOpen && 'show'} mt-5 mt-sm-4`}
        id="collapseWeeklyRates"
      >
        <div className="row">
          <div className="col-md-12">
            <div className="d-sm-flex justify-content-sm-between align-items-sm-end gap-3 mx-1 mb-3">
              <div className="w-sm-100 w-25 order-2 mb-4 mb-sm-0">
                <label htmlFor="year" className="mb-1 d-sm-none">
                  {lang[currentLang].weeklyRates.selectYear}
                </label>
                <select
                  className="form-select form-select-lg select-filterr w-100 number-font"
                  name="year"
                  id="year"
                  onChange={handleSelectYear}
                  value={selectedYear}
                >
                  {years.map((y: number) => (
                    <option value={y} key={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex justify-content-start gap-4 mt-sm-0 mt-1 mb-4 mb-sm-0 order-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="chartType"
                    id="lineChart"
                    checked={chartType === 'line'}
                    onChange={() => setChartType('line')}
                  />
                  <label className="form-check-label ms-1" htmlFor="lineChart">
                    {lang[currentLang].weeklyRates.lineChart}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="chartType"
                    id="columnChart"
                    checked={chartType === 'column'}
                    onChange={() => setChartType('column')}
                  />
                  <label
                    className="form-check-label ms-1"
                    htmlFor="columnChart"
                  >
                    {lang[currentLang].weeklyRates.columnChart}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        {chartType === 'line' ? (
          <div className="row">
            <div className="col-md-12 chart">
              <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                <div style={{ minWidth: '900px', paddingBottom: '0' }}>
                  <LineChart
                    key={chartKey}
                    rates={yearlyRates}
                    theme={theme}
                    selectedYear={selectedYear}
                    numberOfWeeks={numberOfWeeks}
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
                  <BarChart
                    key={chartKey}
                    rates={yearlyRates}
                    theme={theme}
                    selectedYear={selectedYear}
                    numberOfWeeks={numberOfWeeks}
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

export default WeeklyRateCharts
