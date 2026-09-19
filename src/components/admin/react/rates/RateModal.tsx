import { useState } from 'react'
import RateDatePicker from '@components/admin/react/rates/RateDatePicker.tsx'

type NewRateButtonProps = {
  title: string
  date: string
}

const MAX_DECIMAL_PLACES = 3

function RateModal({ title, date }: NewRateButtonProps) {
  const [us30YrFrm, setInterestRate30] = useState<number>(0)
  const [us15YrFrm, setInterestRate15] = useState<number>(0)

  return (
    <div className="modal fade" id="addRate" tabIndex={-1} aria-labelledby="addRateLabel" aria-hidden="true">
      <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h1 className="modal-title fs-5 fw-bold mb-0" id="addRateLabel">{title}</h1>
            <a href="#" className="bi bi-x-lg h4 mb-0" data-bs-dismiss="modal" aria-label="Close"></a>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="_30YrFixed" className="form-label mb-0">30 Yr. Fixed</label>
              <div className="field-group">
                <input
                  type="text"
                  inputMode={'decimal'}
                  className="form-control form-control-lg"
                  id="_30YrFixed"
                  aria-describedby="us30YrFrm"
                  placeholder="6.30"
                  pattern={`[0-9]*[.,]?[0-9]{0,${MAX_DECIMAL_PLACES}}`}
                  value={
                    typeof us30YrFrm === 'string' &&
                    (us30YrFrm as any).endsWith('.')
                      ? us30YrFrm
                      : String(us30YrFrm)
                  }
                  onChange={(e: any) => {
                    const rawValue = e.target.value
                    const normalized = rawValue.replace(',', '.')

                    if (/^\d*\.?\d*$/.test(normalized)) {
                      // If the normalized string ends with a decimal point, store it as a string
                      if (normalized.endsWith('.') && normalized.length > 0) {
                        setInterestRate30(normalized as any)
                      } else {
                        let parsed = parseFloat(normalized)
                        // Your original clamping for interestRate
                        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                          // Round to MAX_DECIMAL_PLACES on blur
                          const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                          parsed = Math.round(parsed * factor) / factor

                          parsed = Math.min(100, Math.max(0, parsed))

                          setInterestRate30(parsed) // Store as number
                        } else if (normalized === '') {
                          setInterestRate30(0) // Treat empty as 0
                        }
                      }
                    }
                  }}
                  onBlur={(e: any) => {
                    let value = parseFloat(e.target.value.replace(',', '.'))
                    if (!isNaN(value)) {
                      // Round to MAX_DECIMAL_PLACES on blur
                      const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                      value = Math.round(value * factor) / factor

                      const clamped = Math.min(100, Math.max(0, value))

                      setInterestRate30(clamped)
                    } else {
                      setInterestRate30(0)
                    }
                  }}
                />
                <span className="field-group-end">%</span>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="_15YrFixed" className="form-label mb-0">15 Yr. Fixed</label>
              <div className="field-group">
                <input
                  type="text"
                  inputMode={'decimal'}
                  className="form-control form-control-lg"
                  id="_15YrFixed"
                  aria-describedby="us15YrFrm"
                  placeholder="6.30"
                  pattern={`[0-9]*[.,]?[0-9]{0,${MAX_DECIMAL_PLACES}}`}
                  value={
                    typeof us15YrFrm === 'string' &&
                    (us15YrFrm as any).endsWith('.')
                      ? us15YrFrm
                      : String(us15YrFrm)
                  }
                  onChange={(e: any) => {
                    const rawValue = e.target.value
                    const normalized = rawValue.replace(',', '.')

                    if (/^\d*\.?\d*$/.test(normalized)) {
                      // If the normalized string ends with a decimal point, store it as a string
                      if (normalized.endsWith('.') && normalized.length > 0) {
                        setInterestRate15(normalized as any)
                      } else {
                        let parsed = parseFloat(normalized)
                        // Your original clamping for interestRate
                        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                          // Round to MAX_DECIMAL_PLACES on blur
                          const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                          parsed = Math.round(parsed * factor) / factor

                          parsed = Math.min(100, Math.max(0, parsed))

                          setInterestRate15(parsed) // Store as number
                        } else if (normalized === '') {
                          setInterestRate15(0) // Treat empty as 0
                        }
                      }
                    }
                  }}
                  onBlur={(e: any) => {
                    let value = parseFloat(e.target.value.replace(',', '.'))
                    if (!isNaN(value)) {
                      // Round to MAX_DECIMAL_PLACES on blur
                      const factor = Math.pow(10, MAX_DECIMAL_PLACES)
                      value = Math.round(value * factor) / factor

                      const clamped = Math.min(100, Math.max(0, value))

                      setInterestRate15(clamped)
                    } else {
                      setInterestRate15(0)
                    }
                  }}
                />
                <span className="field-group-end">%</span>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="_date" className="form-label mb-0">Date</label>
              <div className="date-wrapper date-wrapper-lg">
                <RateDatePicker baseDate={date} />
              </div>
            </div>

          </div>
          <div className="modal-footer d-flex justify-content-start gap-1">
            <button type="button" className="btn btn-lg btn-modal fw-light m-0">Add</button>
            <button type="button" className="btn btn-lg btn-transparent fw-light m-0" data-bs-dismiss="modal">Cancel
            </button>
          </div>
        </div>
      </div>
    </div>)
}

export default RateModal
