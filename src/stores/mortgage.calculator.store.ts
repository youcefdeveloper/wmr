import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type State = {
  // Inputs
  homePrice: number
  loanTerm: number // in years
  interestRate: number // annual %
  downPaymentDollar: number
  downPaymentPercent: number
  hoaFees: number
  privateMortgageInsurance: number
  homeownersInsurance: number
  propertyTax: number
  hasHydrated: boolean

  // Outputs
  principalInterest: number
  loanAmount: number
  lastEditedField: 'percent' | 'dollar' | null
  isClear: boolean

  // Drawers
  isWeeklyRatesDrawerOpen: boolean
  isYearlyAvgRatesDrawerOpen: boolean
  isMortgageCalculatorDrawerOpen: boolean
  isTaxInsuranceHoaFeesDrawerOpen: boolean
  isPMIHoaFeesDrawerOpen: boolean

  // Languages
  lang: 'en' | 'ar'
}

type Actions = {
  setHomePrice: (value: number) => void
  setLoanTerm: (value: number) => void
  setInterestRate: (value: number) => void
  setInitInterestRate: (value: number) => void
  setPrincipalInterest: (value: number) => void
  setPropertyTax: (value: number) => void
  setHomeownersInsurance: (value: number) => void
  setPrivateMortgageInsurance: (value: number) => void
  setHoaFees: (value: number) => void
  setDownPaymentDollar: (value: number) => void
  setDownPaymentPercent: (value: number) => void
  setLoanAmount: () => void
  setLastEditedField: (field: 'percent' | 'dollar') => void
  calculatePrincipalInterest: () => void
  setIsClear: (value: boolean) => void
  setHasHydrated: (value: boolean) => void
  clearData: () => void
  setIsWeeklyRatesDrawerOpen: (value: boolean) => void
  setIsYearlyAvgRatesDrawerOpen: (value: boolean) => void
  setIsMortgageCalculatorDrawerOpen: (value: boolean) => void
  setIsTaxInsuranceHoaFeesDrawerOpen: (value: boolean) => void
  setIsPMIHoaFeesDrawerOpen: (value: boolean) => void
  setLang: (field: 'en' | 'ar') => void
}

const calculateMonthlyPayment = (
  loanAmount: number,
  annualRate: number,
  years: number,
): number => {
  const monthlyRate = annualRate / 100 / 12
  const n = years * 12
  if (monthlyRate === 0) return loanAmount / n
  return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n))
}

const notClear = <T extends Partial<State>>(update: T) => ({
  ...update,
  isClear: false,
})

const useMortgageCalculatorStore = create(
  devtools(
    persist<State & Actions>(
      (set, get) => ({
        // Initial state
        homePrice: 425000,
        loanTerm: 30,
        interestRate: 0,
        principalInterest: 0,
        propertyTax: 350,
        homeownersInsurance: 100,
        privateMortgageInsurance: 0,
        hoaFees: 0,
        downPaymentDollar: 0,
        downPaymentPercent: 5,
        loanAmount: 0,
        lastEditedField: null,
        isClear: true,
        hasHydrated: false,

        // Drawers
        isWeeklyRatesDrawerOpen: true,
        isYearlyAvgRatesDrawerOpen: false,
        isMortgageCalculatorDrawerOpen: false,
        isTaxInsuranceHoaFeesDrawerOpen: false,
        isPMIHoaFeesDrawerOpen: false,

        // Languages
        lang: 'en',

        // Setters
        setHomePrice: (value) => set(notClear({ homePrice: value })),
        setLoanTerm: (value) => set(notClear({ loanTerm: value })),
        setInterestRate: (value) => set(notClear({ interestRate: value })),
        setInitInterestRate: (value) => set({ interestRate: value }),
        setPrincipalInterest: (value) =>
          set(notClear({ principalInterest: value })),
        setPropertyTax: (value) => set(notClear({ propertyTax: value })),
        setHomeownersInsurance: (value) =>
          set(notClear({ homeownersInsurance: value })),
        setPrivateMortgageInsurance: (value) =>
          set(notClear({ privateMortgageInsurance: value })),
        setHoaFees: (value) => set(notClear({ hoaFees: value })),
        setDownPaymentDollar: (value) =>
          set(notClear({ downPaymentDollar: value })),
        setDownPaymentPercent: (value) =>
          set(notClear({ downPaymentPercent: value })),

        setLastEditedField: (field: 'percent' | 'dollar') =>
          set(notClear({ lastEditedField: field })),

        setLang: (field: 'en' | 'ar') => set(notClear({ lang: field })),

        setLoanAmount: () => {
          set((state) => {
            const { homePrice, downPaymentDollar, downPaymentPercent } = state

            let resolvedDownPaymentDollar = downPaymentDollar
            let resolvedDownPaymentPercent = downPaymentPercent

            // Recalculate missing values based on whichever is defined
            if (downPaymentPercent > 0) {
              resolvedDownPaymentDollar = Math.round(
                (homePrice * downPaymentPercent) / 100,
              )
            } else if (downPaymentDollar > 0) {
              resolvedDownPaymentPercent = Math.round(
                (downPaymentDollar / homePrice) * 100,
              )
            }

            const loanAmount = homePrice - resolvedDownPaymentDollar

            return {
              downPaymentDollar: resolvedDownPaymentDollar,
              downPaymentPercent: resolvedDownPaymentPercent,
              loanAmount: loanAmount,
            }
          })
        },

        setHasHydrated: (value) => set({ hasHydrated: value }),

        setIsWeeklyRatesDrawerOpen: (value) =>
          set({ isWeeklyRatesDrawerOpen: value }),
        setIsYearlyAvgRatesDrawerOpen: (value) =>
          set({ isYearlyAvgRatesDrawerOpen: value }),
        setIsMortgageCalculatorDrawerOpen: (value) =>
          set({ isMortgageCalculatorDrawerOpen: value }),
        setIsTaxInsuranceHoaFeesDrawerOpen: (value) =>
          set({ isTaxInsuranceHoaFeesDrawerOpen: value }),
        setIsPMIHoaFeesDrawerOpen: (value) =>
          set({ isPMIHoaFeesDrawerOpen: value }),

        // Calculation
        calculatePrincipalInterest: () => {
          const { homePrice, downPaymentDollar, interestRate, loanTerm } = get()

          const loanAmount = homePrice - downPaymentDollar
          const payment = calculateMonthlyPayment(
            loanAmount,
            interestRate,
            loanTerm,
          )
          set({ principalInterest: Math.round(payment) })
        },

        // Clear
        setIsClear: (value) => set({ isClear: value }),
        clearData: () =>
          set({
            homePrice: 425000,
            interestRate: 0,
            propertyTax: 350,
            loanTerm: 30,
            downPaymentDollar: 0,
            downPaymentPercent: 5,
            principalInterest: 0,
            homeownersInsurance: 100,
            privateMortgageInsurance: 0,
            hoaFees: 0,
            loanAmount: 0,
            lastEditedField: null,
            isClear: true,
          }),
      }),
      {
        name: 'mortgage_calculator_storage',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
        },
      },
    ),
  ),
)

export { useMortgageCalculatorStore }
