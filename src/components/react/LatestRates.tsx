import lang from '@lang/lang.json'
import color from '@theme/colors.json'

import type { Rates } from '@api-v1-types/common'
import WeekRange from './WeekRange'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import { formatDate } from '@utils/common'

type LatestRatesProps = {
  count: number
  avg30: number
  latestRates: Rates
  currentYearRates: Rates[]
  us30Min: number
  us30Max: number
  current30Yr: number
  averagePercentage30Yr: number
  avg15: number
  us15Min: number
  us15Max: number
  current15Yr: number
  averagePercentage15Yr: number
}

function LatestRates({
  count,
  avg30,
  latestRates,
  currentYearRates,
  us30Min,
  us30Max,
  current30Yr,
  averagePercentage30Yr,
  avg15,
  us15Min,
  us15Max,
  current15Yr,
  averagePercentage15Yr,
}: LatestRatesProps) {
  const { lang: currentLang } = useMortgageCalculatorStore()

  const isArabic = currentLang === 'ar'

  return (
    <>
      <p className="lead text-center mb-5">
        {`${lang[currentLang].updatedRates.title} `}
        <span className="fw-semibold">
          {latestRates && formatDate(latestRates.week, currentLang)}
        </span>
      </p>
      <div className="row mb-5">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="card-title mb-0">
                  {lang[currentLang].updatedRates['30YrFixed']}
                </h3>
                <div>
                  {count}-{lang[currentLang].updatedRates.wkAvg}:{' '}
                  {avg30.toFixed(2)}%
                </div>
              </div>
              <h1 className="display-3 fw-bold text-center py-3 number-font">
                {isArabic && '%'}
                {latestRates.us30_yr_frm.toFixed(2)}
                {!isArabic && '%'}
              </h1>
              <hr />
              <WeekRange
                color={color.chart['30YrFixed']}
                numberOfWeeks={!!currentYearRates ? currentYearRates.length : 0}
                minRate={us30Min}
                maxRate={us30Max}
                currentRate={current30Yr}
                averagePercentage={averagePercentage30Yr}
              />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="card-title mb-0">
                  {lang[currentLang].updatedRates['15YrFixed']}
                </h3>
                <div>
                  {count}-{lang[currentLang].updatedRates.wkAvg}:{' '}
                  {avg15.toFixed(2)}%
                </div>
              </div>
              <h1 className="display-3 fw-bold text-center py-3 number-font">
                {isArabic && '%'}
                {latestRates.us15_yr_frm.toFixed(2)}
                {!isArabic && '%'}
              </h1>
              <hr />
              <WeekRange
                color={color.chart['15YrFixed']}
                numberOfWeeks={!!currentYearRates ? currentYearRates.length : 0}
                minRate={us15Min}
                maxRate={us15Max}
                currentRate={current15Yr}
                averagePercentage={averagePercentage15Yr}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LatestRates
