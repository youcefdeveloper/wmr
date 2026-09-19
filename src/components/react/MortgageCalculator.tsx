import lang from '@lang/lang.json'
import color from '@theme/colors.json'

import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import PieChart from './PieChart'
import { useEffect, useState } from 'react'

type MortgageCalculatorProps = {
  current30Yr: number
  current15Yr: number
}

export const MortgageCalculator = ({
  current30Yr,
  current15Yr,
}: MortgageCalculatorProps) => {
  const [chartKey, setChartKey] = useState(0)

  const MAX_DECIMAL_PLACES = 3

  const {
    propertyTax,
    homeownersInsurance,
    privateMortgageInsurance,
    hoaFees,
    principalInterest,
    setPropertyTax,
    setHomeownersInsurance,
    setPrivateMortgageInsurance,
    setHoaFees,
    homePrice,
    loanTerm,
    interestRate,
    setHomePrice,
    setLoanTerm,
    setInterestRate,
    setInitInterestRate,
    calculatePrincipalInterest,
    downPaymentDollar,
    downPaymentPercent,
    setDownPaymentDollar,
    setDownPaymentPercent,
    loanAmount,
    setLoanAmount,
    lastEditedField,
    setLastEditedField,
    clearData,
    isClear,
    hasHydrated,
    isMortgageCalculatorDrawerOpen,
    setIsMortgageCalculatorDrawerOpen,
    isTaxInsuranceHoaFeesDrawerOpen,
    setIsTaxInsuranceHoaFeesDrawerOpen,
    isPMIHoaFeesDrawerOpen,
    setIsPMIHoaFeesDrawerOpen,
    lang: currentLang,
  } = useMortgageCalculatorStore()

  const isArabic = currentLang === 'ar'

  const total =
    principalInterest +
    propertyTax +
    homeownersInsurance +
    privateMortgageInsurance +
    hoaFees

  const percent = (value: number) => {
    if (isArabic) {
      return total === 0 ? `%0` : `%${Math.round((value / total) * 100)}`
    } else {
      return total === 0 ? `0%` : `${Math.round((value / total) * 100)}%`
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value))
  }

  useEffect(() => {
    if (lastEditedField === 'percent') {
      const dollar = Math.round((homePrice * downPaymentPercent) / 100)
      setDownPaymentDollar(dollar)
    } else if (lastEditedField === 'dollar') {
      const percent = homePrice
        ? Number(
            ((downPaymentDollar / homePrice) * 100).toFixed(MAX_DECIMAL_PLACES),
          )
        : 0
      setDownPaymentPercent(percent)
    }

    if (downPaymentPercent >= 20) {
      setPrivateMortgageInsurance(0)
    }

    setLoanAmount()
    calculatePrincipalInterest()
  }, [homePrice, downPaymentDollar, downPaymentPercent, setLoanAmount])

  useEffect(() => {
    if (!hasHydrated) return

    if (current30Yr && isClear && interestRate === 0) {
      setInitInterestRate(current30Yr)
    }
  }, [current30Yr, isClear, interestRate, hasHydrated])

  useEffect(() => {
    // const weeklyChart = document.querySelector(
    //   '#collapseMortgageCalculator .chart',
    // ) as HTMLElement | null

    // if (weeklyChart) weeklyChart.style.visibility = 'hidden'

    const handleShown = () => {
      setChartKey((prev) => prev + 1)
      setTimeout(() => {
        const el = document.querySelector(
          '#collapseMortgageCalculator .chart',
        ) as HTMLElement | null
        if (el) el.style.visibility = 'visible'

        // Scroll to drawer (with offset)
        const targetEl = document.getElementById('mortgageCalculatorTarget')
        if (targetEl) {
          const yOffset = window.innerWidth >= 768 ? -140 : -120
          const y =
            targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset

          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 300)
    }

    const collapse = document.getElementById('collapseMortgageCalculator')
    collapse?.addEventListener('shown.bs.collapse', handleShown)

    return () => {
      collapse?.removeEventListener('shown.bs.collapse', handleShown)
    }
  }, [])

  return (
    <>
      <div
        className={`drawer ${!isMortgageCalculatorDrawerOpen && 'collapsed'}`}
        data-bs-toggle="collapse"
        data-bs-target="#collapseMortgageCalculator"
        aria-expanded="false"
        aria-controls="collapseMortgageCalculator"
        role="button"
        id="mortgageCalculatorTarget"
        onClick={() => {
          // setIsMortgageCalculatorDrawerOpen(!isMortgageCalculatorDrawerOpen)
          const newState = !isMortgageCalculatorDrawerOpen
          setIsMortgageCalculatorDrawerOpen(newState)

          if (!isMortgageCalculatorDrawerOpen) {
            setTimeout(() => {
              const el = document.getElementById('mortgageCalculatorTarget')
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
        <h5 className="mb-0 ms-1 fw-medium drawer-title">
          {lang[currentLang].mortgageCalculator.title}
        </h5>
      </div>

      <div
        className={`collapse mt-5 ${isMortgageCalculatorDrawerOpen && 'show'}`}
        id="collapseMortgageCalculator"
      >
        <div className="row">
          <div className="col-md-5 col-lg-4">
            <div className="ms-1">
              {/* Other Inputs Left As Static */}
              <div className="mb-3">
                <label htmlFor="homePrice" className="mb-1">
                  {lang[currentLang].mortgageCalculator.homePrice}
                </label>
                <div className="field-group">
                  <span className="field-group-start">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={`[0-9]*[.,]?[0-9]`}
                    className="form-control form-control-lg currency-input-left"
                    id="homePrice"
                    aria-describedby="homePrice"
                    value={homePrice.toLocaleString()}
                    onChange={(e) => {
                      const value = Number(
                        e.target.value.replace(/[^0-9.]/g, ''),
                      )
                      setHomePrice(value)
                    }}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="downloadPaymentDollar" className="mb-1">
                  {lang[currentLang].mortgageCalculator.downPayment}
                </label>
                <div className="d-flex gap-2">
                  <div className="field-group w-100">
                    <span className="field-group-start">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]`}
                      className={`form-control form-control-lg currency-input-left`}
                      aria-describedby="downloadPaymentDollar"
                      id="downloadPaymentDollar"
                      value={downPaymentDollar.toLocaleString()}
                      onChange={(e) => {
                        let value = Number(
                          e.target.value.replace(/[^0-9.]/g, ''),
                        )
                        // Enforce: Down Payment Dollar should not be greater than Home Price
                        if (value > homePrice && homePrice !== 0) {
                          value = homePrice
                        }
                        setDownPaymentDollar(value)
                        setLastEditedField('dollar')
                      }}
                      disabled={true}
                    />
                  </div>
                  <div className="field-group">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]{0,${MAX_DECIMAL_PLACES}}`}
                      className="form-control form-control-lg percentage-input"
                      aria-describedby="downloadPayment"
                      id="downloadPaymentPercent"
                      value={
                        // This part needs to handle both number and string types for downPaymentPercent
                        typeof downPaymentPercent === 'string' &&
                        (downPaymentPercent as any).endsWith('.')
                          ? downPaymentPercent
                          : String(downPaymentPercent) // Ensure it's always a string for the value prop
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value
                        const normalized = rawValue.replace(',', '.')

                        // Allow valid decimal input structure, including a trailing dot
                        if (/^\d*\.?\d*$/.test(normalized)) {
                          // Keep the raw string value in state temporarily if it ends with a dot
                          if (
                            normalized.endsWith('.') &&
                            normalized.length > 0
                          ) {
                            setDownPaymentPercent(normalized as any) // Store as string
                          } else {
                            let parsed = parseFloat(normalized)

                            if (!isNaN(parsed)) {
                              // Clamp to 0–100 range
                              if (parsed >= 0 && parsed <= 100) {
                                // Round to MAX_DECIMAL_PLACES on blur
                                const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                                parsed = Math.round(parsed * factor) / factor

                                parsed = Math.min(100, Math.max(0, parsed))

                                setDownPaymentPercent(parsed) // Store as number
                                setLastEditedField('percent')
                              }
                            } else if (normalized === '') {
                              // Treat empty input as 0
                              setDownPaymentPercent(0) // Store as number
                            }
                          }
                        }
                      }}
                      onBlur={(e) => {
                        let value = parseFloat(e.target.value.replace(',', '.'))
                        if (isNaN(value)) {
                          value = 0
                        }

                        // Round to MAX_DECIMAL_PLACES on blur
                        const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                        value = Math.round(value * factor) / factor

                        const clamped = Math.min(100, Math.max(0, value))
                        setDownPaymentPercent(clamped)
                      }}
                      style={{ width: 120 }}
                    />
                    <span className="field-group-end">%</span>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="loanTerm" className="mb-1">
                  {lang[currentLang].mortgageCalculator.loanTerm}
                </label>
                <select
                  className="form-select form-select-lg select-filterr w-100"
                  id="loanTerm"
                  aria-describedby="loanTerm"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                >
                  <option value={'30'}>
                    {lang[currentLang].mortgageCalculator['30YrFixed']}
                  </option>
                  <option value={'15'}>
                    {lang[currentLang].mortgageCalculator['15YrFixed']}
                  </option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="interestRate" className="mb-1">
                  {lang[currentLang].mortgageCalculator.interestRate}
                </label>
                <div className="field-group">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={`[0-9]*[.,]?[0-9]{0,${MAX_DECIMAL_PLACES}}`}
                    className="form-control form-control-lg percentage-input"
                    id="interestRate"
                    aria-describedby="interestRate"
                    value={
                      // Apply the same logic: display raw string if it ends with '.', otherwise stringify the number
                      typeof interestRate === 'string' &&
                      (interestRate as any).endsWith('.')
                        ? interestRate
                        : String(interestRate)
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value
                      const normalized = rawValue.replace(',', '.')

                      if (/^\d*\.?\d*$/.test(normalized)) {
                        // If the normalized string ends with a decimal point, store it as a string
                        if (normalized.endsWith('.') && normalized.length > 0) {
                          setInterestRate(normalized as any)
                        } else {
                          let parsed = parseFloat(normalized)
                          // Your original clamping for interestRate
                          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                            // Round to MAX_DECIMAL_PLACES on blur
                            const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                            parsed = Math.round(parsed * factor) / factor

                            parsed = Math.min(100, Math.max(0, parsed))

                            setInterestRate(parsed) // Store as number
                          } else if (normalized === '') {
                            setInterestRate(0) // Treat empty as 0
                          }
                        }
                      }
                    }}
                    onBlur={(e) => {
                      let value = parseFloat(e.target.value.replace(',', '.'))
                      if (!isNaN(value)) {
                        // Round to MAX_DECIMAL_PLACES on blur
                        const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                        value = Math.round(value * factor) / factor

                        const clamped = Math.min(100, Math.max(0, value))

                        setInterestRate(clamped)
                      } else {
                        setInterestRate(0)
                      }
                    }}
                  />
                  <span className="field-group-end">%</span>
                </div>
              </div>
              <div
                className={`drawer-chevron ${
                  !isTaxInsuranceHoaFeesDrawerOpen && 'collapsed'
                }`}
                data-bs-toggle="collapse"
                data-bs-target="#collapseOtherFees"
                aria-expanded="false"
                aria-controls="collapseOtherFees"
                role="button"
                onClick={() => {
                  setIsTaxInsuranceHoaFeesDrawerOpen(
                    !isTaxInsuranceHoaFeesDrawerOpen,
                  )
                }}
              >
                <h6 className={`mt-5 ${isTaxInsuranceHoaFeesDrawerOpen ? 'mb-4' : 'mb-5'} fw-normal`}>
                  {lang[currentLang].mortgageCalculator.taxesInsuranceHoaFees}
                </h6>
              </div>
              <div
                className={`mb-5 collapse ${
                  isTaxInsuranceHoaFeesDrawerOpen && 'show'
                }`}
                id="collapseOtherFees"
              >
                <div className="mb-3">
                  <label htmlFor="propertyTax" className="mb-1">
                    {lang[currentLang].mortgageCalculator.propertyTax}
                  </label>
                  <div className="field-group">
                    <span className="field-group-start">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]`}
                      className="form-control form-control-lg currency-input"
                      id="propertyTax"
                      value={propertyTax.toLocaleString()}
                      onChange={(e) => {
                        let value = Number(
                          e.target.value.replace(/[^0-9.]/g, ''),
                        )
                        // Enforce: Down Payment Dollar should not be greater than Home Price
                        if (value > homePrice && homePrice !== 0) {
                          value = homePrice
                        }
                        setPropertyTax(value)
                      }}
                    />
                    <span className="field-group-end field-group-end-small">
                      /{lang[currentLang].mortgageCalculator.month}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="homeownersInsurance" className="mb-1">
                    {lang[currentLang].mortgageCalculator.homeownersInsurance}
                  </label>
                  <div className="field-group">
                    <span className="field-group-start">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]`}
                      className="form-control form-control-lg currency-input"
                      id="homeownersInsurance"
                      value={homeownersInsurance.toLocaleString()}
                      onChange={(e) => {
                        let value = Number(
                          e.target.value.replace(/[^0-9.]/g, ''),
                        )
                        // Enforce: Down Payment Dollar should not be greater than Home Price
                        if (value > homePrice && homePrice !== 0) {
                          value = homePrice
                        }
                        setHomeownersInsurance(value)
                      }}
                    />
                    <span className="field-group-end field-group-end-small">
                      /{lang[currentLang].mortgageCalculator.month}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="privateMortgageInsurance" className="mb-1">
                    {
                      lang[currentLang].mortgageCalculator
                        .privateMortgageInsurance
                    }
                  </label>
                  <div className="field-group">
                    <span className="field-group-start">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]`}
                      className={`form-control form-control-lg currency-input`}
                      id="privateMortgageInsurance"
                      value={privateMortgageInsurance.toLocaleString()}
                      onChange={(e) => {
                        let value = Number(
                          e.target.value.replace(/[^0-9.]/g, ''),
                        )
                        // Enforce: Down Payment Dollar should not be greater than Home Price
                        if (value > homePrice && homePrice !== 0) {
                          value = homePrice
                        }
                        setPrivateMortgageInsurance(value)
                      }}
                      disabled={downPaymentPercent >= 20}
                    />
                    <span className="field-group-end field-group-end-small">
                      /{lang[currentLang].mortgageCalculator.month}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="hoaFees" className="mb-1">
                    {lang[currentLang].mortgageCalculator.hoaFees}
                  </label>
                  <div className="field-group">
                    <span className="field-group-start">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern={`[0-9]*[.,]?[0-9]`}
                      className="form-control form-control-lg currency-input"
                      id="hoaFees"
                      value={hoaFees.toLocaleString()}
                      onChange={(e) => {
                        let value = Number(
                          e.target.value.replace(/[^0-9.]/g, ''),
                        )
                        // Enforce: Down Payment Dollar should not be greater than Home Price
                        if (value > homePrice && homePrice !== 0) {
                          value = homePrice
                        }
                        setHoaFees(value)
                      }}
                    />
                    <span className="field-group-end field-group-end-small">
                      /{lang[currentLang].mortgageCalculator.month}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-7 col-lg-8">
            <div className="card card-h-auto">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-4 mb-5">
                  <h5 className="mb-0">
                    {lang[currentLang].mortgageCalculator.breakdownTitle}
                  </h5>
                  {!isClear && (
                    <div
                      className="fw-light clear"
                      role="button"
                      onClick={() => clearData()}
                    >
                      {lang[currentLang].mortgageCalculator.clear}
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="col-lg-5 col-xl-4 mb-4 mb-lg-0">
                    <PieChart key={chartKey} />
                  </div>
                  <div className="col-lg-7 col-xl-8">
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <div className="d-flex justify-content-start align-items-center gap-2 small-sm">
                        <span
                          className="legend"
                          style={{
                            backgroundColor: color.chart.principalAndInterest,
                          }}
                        ></span>
                        <div>
                          {percent(principalInterest)}{' '}
                          {
                            lang[currentLang].mortgageCalculator
                              .principalAndInterest
                          }
                        </div>
                      </div>
                      <h5 className="mb-0 fw-bold number-font">
                        ${principalInterest.toLocaleString()}
                      </h5>
                    </div>
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <div className="d-flex justify-content-start align-items-center gap-2 small-sm">
                        <span
                          className="legend"
                          style={{
                            backgroundColor: color.chart.propertyTax,
                          }}
                        ></span>
                        <div>
                          {percent(propertyTax)}{' '}
                          {lang[currentLang].mortgageCalculator.propertyTax}
                        </div>
                      </div>
                      <div className="field-group breakdown-input">
                        <span className="field-group-start">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern={`[0-9]*[.,]?[0-9]`}
                          className="form-control form-control-lg currency-input-small"
                          id="propertyTaxSummary"
                          value={propertyTax.toLocaleString()}
                          onChange={(e) => {
                            let value = Number(
                              e.target.value.replace(/[^0-9.]/g, ''),
                            )
                            // Enforce: Down Payment Dollar should not be greater than Home Price
                            if (value > homePrice && homePrice !== 0) {
                              value = homePrice
                            }
                            setPropertyTax(value)
                          }}
                        />
                        <span className="field-group-end field-group-end-small">
                          /{lang[currentLang].mortgageCalculator.month}
                        </span>
                      </div>
                    </div>
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <div className="d-flex justify-content-start align-items-center gap-2 small-sm">
                        <span
                          className="legend"
                          style={{
                            backgroundColor: color.chart.homeownersInsurance,
                          }}
                        ></span>
                        <div>
                          {percent(homeownersInsurance)}{' '}
                          {
                            lang[currentLang].mortgageCalculator
                              .homeownersInsurance
                          }
                        </div>
                      </div>
                      <div className="field-group breakdown-input">
                        <span className="field-group-start">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern={`[0-9]*[.,]?[0-9]`}
                          className="form-control form-control-lg currency-input-small"
                          id="homeownersInsuranceSummary"
                          value={homeownersInsurance.toLocaleString()}
                          onChange={(e) => {
                            let value = Number(
                              e.target.value.replace(/[^0-9.]/g, ''),
                            )
                            // Enforce: Down Payment Dollar should not be greater than Home Price
                            if (value > homePrice && homePrice !== 0) {
                              value = homePrice
                            }
                            setHomeownersInsurance(value)
                          }}
                        />
                        <span className="field-group-end field-group-end-small">
                          /{lang[currentLang].mortgageCalculator.month}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`drawer-chevron d-flex justify-content-start ${
                        !isPMIHoaFeesDrawerOpen && 'collapsed'
                      }`}
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseInnerOtherFees"
                      aria-expanded="false"
                      aria-controls="collapseInnerOtherFees"
                      role="button"
                      onClick={() => {
                        setIsPMIHoaFeesDrawerOpen(!isPMIHoaFeesDrawerOpen)
                      }}
                    >
                      <h6 className="mt-5 mb-4 fw-normal">
                        {lang[currentLang].mortgageCalculator.pmiHoaFees}
                      </h6>
                    </div>
                    <div
                      className={`collapse mb-5 ${
                        isPMIHoaFeesDrawerOpen && 'show'
                      }`}
                      id="collapseInnerOtherFees"
                    >
                      <div className="d-flex justify-content-between align-items-center gap-3">
                        <div className="d-flex justify-content-start align-items-center gap-2 small-sm">
                          <span
                            className="legend"
                            style={{
                              backgroundColor:
                                color.chart.privateMortgageInsurance,
                            }}
                          ></span>
                          <div>
                            {percent(privateMortgageInsurance)}{' '}
                            {
                              lang[currentLang].mortgageCalculator
                                .privateMortgageInsurance
                            }
                          </div>
                        </div>
                        <div className="field-group breakdown-input">
                          <span className="field-group-start">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern={`[0-9]*[.,]?[0-9]`}
                            className={`form-control form-control-lg currency-input-small`}
                            id="privateMortgageInsuranceSummary"
                            value={privateMortgageInsurance.toLocaleString()}
                            onChange={(e) => {
                              let value = Number(
                                e.target.value.replace(/[^0-9.]/g, ''),
                              )
                              // Enforce: Down Payment Dollar should not be greater than Home Price
                              if (value > homePrice && homePrice !== 0) {
                                value = homePrice
                              }
                              setPrivateMortgageInsurance(value)
                            }}
                            disabled={downPaymentPercent >= 20}
                          />
                          <span className="field-group-end field-group-end-small">
                            /{lang[currentLang].mortgageCalculator.month}
                          </span>
                        </div>
                      </div>
                      <hr className="my-3" />
                      <div className="d-flex justify-content-between align-items-center gap-3">
                        <div className="d-flex justify-content-start align-items-center gap-2 small-sm">
                          <span
                            className="legend"
                            style={{
                              backgroundColor: color.chart.hoaFees,
                            }}
                          ></span>
                          <div>
                            {percent(hoaFees)}{' '}
                            {lang[currentLang].mortgageCalculator.hoaFees}
                          </div>
                        </div>
                        <div className="field-group breakdown-input">
                          <span className="field-group-start">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern={`[0-9]*[.,]?[0-9]`}
                            className="form-control form-control-lg currency-input-small"
                            id="hoaFeesSummary"
                            value={hoaFees.toLocaleString()}
                            onChange={(e) => {
                              let value = Number(
                                e.target.value.replace(/[^0-9.]/g, ''),
                              )
                              // Enforce: Down Payment Dollar should not be greater than Home Price
                              if (value > homePrice && homePrice !== 0) {
                                value = homePrice
                              }
                              setHoaFees(value)
                            }}
                          />
                          <span className="field-group-end field-group-end-small">
                            /{lang[currentLang].mortgageCalculator.month}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center gap-2 mt-4">
                  <h5 className="load-amount-header">
                    {lang[currentLang].mortgageCalculator.loanAmount}
                  </h5>
                  <div
                    className="load-amount number-font"
                    style={{
                      backgroundColor: color.common.loanAmount,
                    }}
                  >
                    ${formatCurrency(loanAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MortgageCalculator
