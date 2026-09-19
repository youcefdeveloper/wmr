import { Chart, type GoogleChartOptions } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import type { USVisitType } from '@admin-types/adminTypes'

type USVisitGeoChartProps = {
    data: USVisitType
}

export default function USVisitGeoChart({ data }: USVisitGeoChartProps) {
  const { theme } = useAdminThemeStore()


  if (!data) return <div className="d-flex justify-content-center py-5">
        <div className="spinner" role="status">
        <span className="visually-hidden">Loading...</span>
        </div>
    </div>

  return (
    <div className="chart-scroll-wrapper-md" style={{ width: '100%' }}>
      <div className="chart-scroll-md chart-geo" style={{ width: '100%' }}>
        <Chart
            chartType="GeoChart"
            width="100%"
            height="600px"
            data={data}
            options={{
              region: 'US',
              displayMode: 'regions',
              resolution: 'provinces',
              chartArea: {},
              tooltip: { 
                isHtml: true,
                textStyle: { 
                    color: theme === 'light' ? '#333' : '#ffffff',
                    fontSize: 15,
                    fontName: 'Hind Madurai',
                },
                trigger: 'focus',
              },
              colorAxis: { 
                colors: ['#d4f1d4', '#7bc67b', '#4da64d'],
                // colors: ['#e5d6ff', '#b299ff', '#6e44ff'],
                minValue: 0,
                legend: {
                  textStyle: {
                    fontName: 'Hind Madurai',
                    fontSize: 12,
                  }
                },
              },
              backgroundColor: theme === 'light' ? color.chart.bgLight : color.chart.bgDark,
              datalessRegionColor: '#FDFDFD',
              fontName: 'Hind Madurai',
            }}
        />
      </div>
    </div>
  )
}