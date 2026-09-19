import { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import type { NewPlatformData } from '@utils/common.ts'
import CardRateSkeleton from './skeletons/CardRateSkeleton';
import USVisitGeoChart from './USVisitGeoChart';
import type { USVisitType } from '@admin-types/adminTypes';
import USVisitLineChart from './USVisitLineChart';
import USVisitColumnChart from './USVisitColumnChart';
import Spinner from './Spinner';

interface USVisitCardProps {
  data: USVisitType;
  visitCount: number;
  totalUSVisitors: number;
  unknownVisitors: number;
  stateCount: number;
}

const USVisitCard = ({ data, visitCount, totalUSVisitors, unknownVisitors, stateCount }: USVisitCardProps) => {
  const { theme } = useAdminThemeStore()
  const [chartType, setChartType] = useState<'geo' | 'column' | 'line'>('geo')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => {
          setLoading(false);
      }, 0); // Simulate a 2000ms loading time
  
      return () => clearTimeout(timer);
  }, []);

  // if (!!!data || loading) return <Spinner />
  if (!!!data || loading) return null

  return (
    <div
      className={`h-100 card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <div className={`d-flex justify-content-between align-items-start align-items-sm-start ${chartType === 'geo' ? 'mb-1' : 'mb-4'}`}>
            <div className="d-block card-title h5 mb-0">
              US Visits ({visitCount})
            </div>
            <select className="form-select select-filter number-font mb-0"
                    style={{ maxWidth: 145, paddingRight: 35 }}
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'geo' | 'column' | 'line')}>
              <option value="geo">Geo Chart</option>
              <option value="column">Column Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
          <div className="d-flex justify-content-between align-items-stretch gap-0">
            {chartType === 'geo' && <USVisitGeoChart data={data} />}
            {chartType === 'column' && <USVisitColumnChart data={data} />}
            {chartType === 'line' && <USVisitLineChart data={data} />}
          </div>
          <div className='mt-4 fw-light small'>
            <p className='mb-1'>Known Locations: <span className='fw-semibold'>{totalUSVisitors}</span></p>
            <p className='mb-1'>Unknown Locations: <span className='fw-semibold'>{unknownVisitors}</span></p>
            <p className='mb-1'>Number of States: <span className='fw-semibold'>{stateCount}</span></p>
          </div>
        </div>
        <div className='d-flex justify-content-end mt-3 small'>
          Since Nov 13, 2025
        </div>
      </div>
    </div>
  )
}

export default USVisitCard