import lang from '@lang/lang.json'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

type WeekRangeProps = {
  color: string
  numberOfWeeks: number
  minRate: number
  maxRate: number
  currentRate: number
  averagePercentage: number
}

const WeekRange = ({
  color,
  numberOfWeeks,
  minRate,
  maxRate,
  currentRate,
  averagePercentage,
}: WeekRangeProps) => {
  const { lang: currentLang } = useMortgageCalculatorStore()

  const isArabic = currentLang === 'ar'

  return (
    <div className="d-flex justify-content-between gap-2">
      <div>
        {numberOfWeeks} {lang[currentLang].updatedRates.weekRange}
      </div>
      <div className="d-flex align-items-center">
        <span style={{ marginTop: 3 }}>
          {isArabic && '%'}
          {minRate.toFixed(2)}
          {!isArabic && '%'}
        </span>
        <div
          className="weekRangeBar"
          style={{
            backgroundColor: color,
          }}
        >
          <div
            className="weekRangeBarSeparator"
            style={{
              [isArabic ? 'right' : 'left']: `${averagePercentage}%`,
            }}
            title={`${currentRate}%`}
          ></div>
        </div>
        <span style={{ marginTop: 3 }}>
          {isArabic && '%'}
          {maxRate.toFixed(2)}
          {!isArabic && '%'}
        </span>
      </div>
    </div>
  )
}

export default WeekRange
