import React from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'

interface AnnualAvgRatesCardProps {
  title: string;
  children: React.ReactNode; // Can be any valid React child (string, element, array of elements, etc.)
}

const AnnualAvgRatesCard = ({ title, children }: AnnualAvgRatesCardProps) => {
  const { theme } = useAdminThemeStore()

  return (
    <div
      className={`card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body pb-0">
        <h5 className="card-title mb-5">{title}</h5>
        {children}
      </div>
    </div>
  )
}

export default AnnualAvgRatesCard