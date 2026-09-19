import React, { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import CardRateSkeleton from './skeletons/CardRateSkeleton';

interface CurrentRateCardProps {
  title: string;
  day: string;
  children: React.ReactNode; // Can be any valid React child (string, element, array of elements, etc.)
}

const CurrentRateCard = ({ title, day, children }: CurrentRateCardProps) => {
  const { theme } = useAdminThemeStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
              setLoading(true);
              const timer = setTimeout(() => {
                  setLoading(false);
              }, 1000); // Simulate a 2000ms loading time
      
              return () => clearTimeout(timer);
          }, []);
  
    // if (!!!day || loading) return <div className="d-flex justify-content-center py-5">
    //       <div className="spinner" role="status">
    //       <span className="visually-hidden">Loading...</span>
    //       </div>
    //   </div>


  if (!!!day || loading) return <CardRateSkeleton theme={theme} />

  return (
    <div
      className={`h-100 card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h5 className="card-title mb-0">{title}</h5>
          <h6 className="card-title mb-0">{day}</h6>
        </div>
        {children}
      </div>
    </div>
  )
}

export default CurrentRateCard