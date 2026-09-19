import { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import DeviceUpdatesHistoryChart from '@components/admin/react/DeviceUpdatesHistoryChart.tsx'
import type { NewPlatformData } from '@utils/common.ts'
import CardPieChartSkeleton from './skeletons/CardPieChartSkeleton';
import { useBootstrapTooltip } from '@hooks/useTooltip';

interface DeviceCardProps {
  data: NewPlatformData[];
}

type SumKeys = keyof Pick<NewPlatformData, 'returning' | 'oneTime'>;


const DeviceUpdatesHistoryCard = ({ data }: DeviceCardProps) => {  
  const { theme } = useAdminThemeStore()
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all')
  const [loading, setLoading] = useState(false)


  const iosSum = (['returning', 'oneTime'] as SumKeys[]).reduce(
    (a, k) => a + (data.find(d => d.platform === platform)?.[k] ?? 0),
    0,
  )

  const title = platform == 'ios' ? `iOS Users` : platform == 'android' ? `Android Users` : `All Users`

  useBootstrapTooltip(theme, [data, platform]);

  useEffect(() => {
          setLoading(true);
          const timer = setTimeout(() => {
              setLoading(false);
          }, 1500); // Simulate a 2000ms loading time
  
          return () => clearTimeout(timer);
      }, []);

  // if (!data || loading) return <div className="d-flex justify-content-center py-5">
  //       <div className="spinner" role="status">
  //       <span className="visually-hidden">Loading...</span>
  //       </div>
  // </div>

  if (!data || loading) return <CardPieChartSkeleton theme={theme} />

  return (
    <div
      className={`card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start align-items-sm-start mb-5">
          <a 
            href={`/dashboard/devices?uOrder=desc&platform=${platform}`} 
            className="d-block card-title h5 mb-0 underline-dotted underline-dotted-lg" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top"
            data-bs-title={` ${title} (${iosSum})`}
            data-bs-custom-class={`custom-tooltip-${theme}`}
          >
            {title} ({iosSum})
          </a>
          <select className="form-select select-filter number-font mb-0"
                  style={{ maxWidth: 110, paddingRight: 40 }}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as 'all' | 'ios' | 'android')}>
            <option value="all">All</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </div>
        <DeviceUpdatesHistoryChart data={data} platform={platform} />
      </div>
    </div>
  )
}

export default DeviceUpdatesHistoryCard