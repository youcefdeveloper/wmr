import { Chart, type GoogleChartOptions } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'

type DeviceChartProps = {
  data: any,
  platform: 'ios' | 'android',
}

// Space per bar. Google Charts drops any axis label that would overlap its
// neighbour, so a fixed height hides every other model name once the list
// grows; at 11px text each label needs roughly this much.
const ROW_HEIGHT = 18
const CHART_AREA = {
  left: 200,
  right: 20,
  top: 10,
  bottom: 90, // Increase bottom margin to fit rotated labels
}
// Bar thickness, independent of the row spacing above.
const BAR_THICKNESS = 12
const MIN_HEIGHT = 300

export default function DeviceChart({ data, platform }: DeviceChartProps) {
  const { theme } = useAdminThemeStore()

  // Material chart options
  const numModels = Array.isArray(data) && data.length > 1 ? data.length - 1 : 0;
  const vAxisTitle = `Device Models (${numModels})`;
  const height = Math.max(
    MIN_HEIGHT,
    numModels * ROW_HEIGHT + CHART_AREA.top + CHART_AREA.bottom,
  )
  const optionsLight: GoogleChartOptions = {
    chart: {
      title: '',
      subtitle: '',
    },
    hAxis: {
      title: `Number of Devices`,
      slantedText: true,
      slantedTextAngle: 90, // Rotate labels
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center',
        italic: false,
      },
    },
    vAxis: {
      title: vAxisTitle,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center', // Align legend text for RTL
        italic: false,
      },
    },
    chartArea: CHART_AREA,
    bar: { groupWidth: String(BAR_THICKNESS) },
    colors: platform === 'ios' ? ['#0284c7'] : ['#ff7f0e'],
    // legend: 'none',
    legend: {
      position: 'bottom',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // 👈 Set legend font size here
        italic: false,
        color: '#333',
      },
    },
    backgroundColor: color.chart.bgLight,
    fontName: 'Hind Madurai',
  }

  const optionsDark: GoogleChartOptions = {
    chart: {
      title: '',
      subtitle: '',
    },
    hAxis: {
      title: `Number of Devices`,
      slantedText: true,
      slantedTextAngle: 90,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11,
        color: '#ffffff', // 👈 make text white for visibility
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        color: '#ffffff',
        italic: false,
      },
    },
    vAxis: {
      title: vAxisTitle,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11,
        color: '#ffffff', // 👈 make text white
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        color: '#ffffff',
        italic: false,
      },
    },
    chartArea: CHART_AREA,
    bar: { groupWidth: String(BAR_THICKNESS) },
    colors: platform === 'ios' ? ['#0284c7'] : ['#ff7f0e'],
    // legend: 'none',
    legend: {
      position: 'bottom',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // 👈 Set legend font size here
        italic: false,
        color: '#ffffff',
      },
    },
    backgroundColor: color.chart.bgDark, // 👈 set background color to black
    fontName: 'Hind Madurai',
  }

  if (!data) return <div className="d-flex justify-content-center py-5">
        <div className="spinner" role="status">
        <span className="visually-hidden">Loading...</span>
        </div>
    </div>

  return (
    <div className="chart-scroll-wrapper">
      <div className="chart-scroll">
        <Chart
          chartType="BarChart"
          height={height}
          width="100%"
          data={data}
          options={theme === 'light' ? optionsLight : optionsDark}
        />
      </div>
    </div>
  )
}