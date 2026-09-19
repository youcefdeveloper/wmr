import React, { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import CardPieChartSkeleton from './skeletons/CardPieChartSkeleton';
import CardBarChartSkeleton from './skeletons/CardBarChartSkeleton';
import { useBootstrapTooltip } from '@hooks/useTooltip';

interface DeviceCardProps {
  title: string;
  totalDevices: number;
  children: React.ReactNode; // Can be any valid React child (string, element, array of elements, etc.)
  isTitleLinked?: boolean;
  chartType?: 'pie' | 'bar';
  platform?: 'all' | 'ios' | 'android';
}

const DeviceCard = ({ title, totalDevices, children, isTitleLinked, chartType, platform }: DeviceCardProps) => {  
  const { theme } = useAdminThemeStore()
  const [loading, setLoading] = useState(false)

  useBootstrapTooltip(theme, [title, totalDevices]);
  
  useEffect(() => {
          setLoading(true);
          const timer = setTimeout(() => {
              setLoading(false);
          }, 1500); // Simulate a 2000ms loading time
  
          return () => clearTimeout(timer);
      }, []);

  // if (!totalDevices || loading) return <div className="d-flex justify-content-center py-5">
  //       <div className="spinner" role="status">
  //       <span className="visually-hidden">Loading...</span>
  //       </div>
  //   </div>

  if (!totalDevices || loading)return chartType === 'pie' ? <CardPieChartSkeleton theme={theme} hideFilter /> : <CardBarChartSkeleton theme={theme} />

  return (
    <div
      className={`h-100 card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body">
        <div className="d-block card-title h5 mb-5">
          {/* {!isTitleLinked ? `${title} (${totalDevices})` :
            <a href={'/dashboard/devices?order=desc'} className={chartType === 'pie' ? 'underline-dotted underline-dotted-lg' : ''}>
              {title} ({totalDevices})
            </a>
          } */}
          {chartType === 'bar' ? 
            <a 
              href={`/dashboard/devices?platform=${platform}&order=desc`} 
              className={chartType === 'bar' ? 'underline-dotted underline-dotted-lg' : ''} 
              data-bs-toggle="tooltip" 
              data-bs-placement="top"
              data-bs-title={`${title} (${totalDevices})`}
              data-bs-custom-class={`custom-tooltip-${theme}`}
            >
              {title} ({totalDevices})
            </a> :
            <a 
              href={'/dashboard/devices?order=desc'} 
              className={chartType === 'pie' ? 'underline-dotted underline-dotted-lg' : ''} 
              data-bs-toggle="tooltip" 
              data-bs-placement="top"
              data-bs-title={`${title} (${totalDevices})`}
              data-bs-custom-class={`custom-tooltip-${theme}`} 
            >
              {title} ({totalDevices})
            </a>
          }
        </div>
        {children}
      </div>
    </div>
  )
}

export default DeviceCard