import { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import type { ComeBack, NewPlatformData } from '@utils/common.ts'
import CardRateSkeleton from './skeletons/CardRateSkeleton';
import { useBootstrapTooltip } from '@hooks/useTooltip';

interface ReturningCardProps {
  data: NewPlatformData[];
}

const ReturningCard = ({ data }: ReturningCardProps) => {
  const { theme } = useAdminThemeStore()
  const [returnedBy, setReturnedBy] = useState<'today' | 'yesterday' | 'last_week' | 'all_time'>('today')
  const [loading, setLoading] = useState(false)

  useBootstrapTooltip(theme, [data, returnedBy]);
    
  const getComebackByPlatform = (
    statsData: NewPlatformData[],
    platform: 'all' | 'ios' | 'android',
  ): ComeBack | undefined | null => {
    const stat = statsData.find(s => s.platform === platform)
    return stat ? stat.comeback?.user : null
  }

  const allComeback = getComebackByPlatform(data, 'all')
  const iOSComeback = getComebackByPlatform(data, 'ios')
  const androidComeback = getComebackByPlatform(data, 'android')

  useEffect(() => {
            setLoading(true);
            const timer = setTimeout(() => {
                setLoading(false);
            }, 1000); // Simulate a 2000ms loading time
    
            return () => clearTimeout(timer);
        }, []);

  // if (!data || loading) return <div className="d-flex justify-content-center py-5">
  //       <div className="spinner" role="status">
  //       <span className="visually-hidden">Loading...</span>
  //       </div>
  //   </div>

  if (!data || loading) return <CardRateSkeleton theme={theme} flip={true} />

  return (
    <div
      className={`h-100 card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start align-items-sm-start mb-5">
          <a 
            href={`/dashboard/devices?visit=returning&visitBy=${returnedBy}&uOrder=desc`} 
            className="d-block card-title h5 mb-0 underline-dotted underline-dotted-lg" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            data-bs-title={`Returning (${!!allComeback && allComeback[returnedBy]})`}
            data-bs-custom-class={`custom-tooltip-${theme}`}
          >
            {`Returning (${!!allComeback && allComeback[returnedBy]})`}
          </a>
          <select className="form-select select-filter number-font mb-0"
                  style={{ maxWidth: 132, paddingRight: 35 }}
                  value={returnedBy}
                  onChange={(e) => setReturnedBy(e.target.value as 'today' | 'yesterday' | 'last_week' | 'all_time')}>
            <option value="today">Today so far</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_week">Last 7 days</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
        <div className="d-flex justify-content-between align-items-stretch gap-0">
          <div className="text-center w-100 pt-2 pb-4">
            <a 
              href={`dashboard/devices?visit=returning&visitBy=${returnedBy}&platform=ios&uOrder=desc`} 
              className="d-block display-4 fw-bold mb-1 underline-dotted underline-dotted-lg"
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              data-bs-title={!!iOSComeback && iOSComeback[returnedBy] + ` iOS User${iOSComeback[returnedBy] !== 1 ? 's' : ''}`}
              data-bs-custom-class={`custom-tooltip-${theme}`}
            >
              {!!iOSComeback && iOSComeback[returnedBy]}
            </a>
            <h6 className="mb-0">iOS User(s)</h6>
          </div>
          <div className="border-start mx-3 admin-rate-separator"></div>
          <div className="text-center w-100 pt-2 pb-4">
            <a 
              href={`dashboard/devices?visit=returning&visitBy=${returnedBy}&platform=android&uOrder=desc`}  
              className="d-block display-4 fw-bold mb-1 underline-dotted underline-dotted-lg"
              data-bs-toggle="tooltip" 
              data-bs-placement="top" 
              data-bs-title={!!androidComeback && androidComeback[returnedBy] + ` Android User${androidComeback[returnedBy] !== 1 ? 's' : ''}`}
              data-bs-custom-class={`custom-tooltip-${theme}`}
            >
              {!!androidComeback && androidComeback[returnedBy]}
            </a>
            <h6 className="mb-0">Android User(s)</h6>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReturningCard