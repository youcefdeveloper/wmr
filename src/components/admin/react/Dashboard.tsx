import CurrentRates from "src/pages/dashboard/partial/CurrentRates.astro"
import ReturningCard from "./ReturningCard"
import DeviceUpdatesHistoryCard from "./DeviceUpdatesHistoryCard"
import DeviceCard from "./DeviceCard"
import DevicesChart from "./DevicesChart"
import DeviceChart from "./DeviceChart"

type DashboardProps = {
    userStats: any,
    totalDevices: number,
    data: any,
    totalIOSDevices: number,
    iOSDeviceData: any,
    totalAndroidDevices: number,
    androidDeviceData: any,
}

const Dashboard = ({userStats, totalDevices, data, totalIOSDevices, iOSDeviceData, totalAndroidDevices, androidDeviceData}: DashboardProps) => {
  return (
    <div className="row">
      <div className="col-lg-6 mb-4">
        <CurrentRates />
      </div>
      <div className="col-lg-6 mb-4">
        <ReturningCard data={userStats} />
      </div>
      <div className="col-lg-6 mb-4">
        <DeviceUpdatesHistoryCard data={userStats} />
      </div>
      <div className="col-lg-6 mb-4">
        <DeviceCard title="All Devices" totalDevices={totalDevices} isTitleLinked>
          <DevicesChart data={data} />
        </DeviceCard>
      </div>
      <div className="col-lg-6 mb-4">
        <DeviceCard 
          title="iOS Devices" 
          totalDevices={totalIOSDevices} 
          chartType={'bar'}
          platform={'ios'}>
          <DeviceChart
            data={iOSDeviceData}
            platform={'ios'}
          />
        </DeviceCard>
      </div>
      <div className="col-lg-6 mb-4">
        <DeviceCard 
          title="Android Devices" 
          totalDevices={totalAndroidDevices} 
          chartType={'bar'}
          platform={'android'}> 
          <DeviceChart
            data={androidDeviceData}
            platform={'android'}
          />
        </DeviceCard>
      </div>
  </div>
  )
}

export default Dashboard