import { useEffect, useState } from 'react'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import type { NewPlatformData } from '@utils/common.ts'
import CardRateSkeleton from './skeletons/CardRateSkeleton';
import type { CountriesResponse } from '@admin-types/adminTypes';
import Spinner from './Spinner';

interface AllVisitCardProps {
  data: CountriesResponse;
  allVisitCount: number;
}

const AllVisitCard = ({ data, allVisitCount}: AllVisitCardProps) => {
  const { theme } = useAdminThemeStore()
  const [chartType, setChartType] = useState<'geo' | 'column' | 'line'>('geo')
  const [loading, setLoading] = useState(false)
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set())

  const toggleCountry = (countryName: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(countryName)) {
        newSet.delete(countryName)
      } else {
        newSet.add(countryName)
      }
      return newSet
    })
  }

  const toggleState = (countryName: string, stateName: string) => {
    const key = `${countryName}__${stateName}`;
    setExpandedStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => {
          setLoading(false);
      }, 0); // Simulate a 2000ms loading time
  
      return () => clearTimeout(timer);
  }, []);

  if (!data || loading) return null

  return (
    <div
      className={`h-100 card ${theme === 'light' ? 'card-light' : 'card-dark'}`}
    >
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-start align-items-sm-start mb-5">
            <div className="d-block card-title h5 mb-0">
              All Visits ({allVisitCount})
            </div>
            <div>{data.length} Countries</div> 
          </div>
          <div
            className="all-visit-chart-wrapper"
            style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 16 }}
          >
            {data.map((country: any) => (
              <div key={country.name}>
                <div
                  className="first-level"
                  onClick={() => toggleCountry(country.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <i
                    className={`bi bi-${
                      expandedCountries.has(country.name) ? 'dash' : 'plus'
                    }-circle`}
                    style={{fontSize: 20, position: 'relative', top: 1}}
                  ></i>{' '} 
                  {country.name}{' '}
                  <span className="fw-semibold">({country.total})</span>
                </div>

                {expandedCountries.has(country.name) && (
                  <div className="second-level">
                    {Object.values(country.states).map((state: any) => (
                      <div key={state.name} style={{ paddingLeft: 34, marginBottom: 16 }}>
                        <div
                          className="second-level-state"
                          onClick={() => toggleState(country.name, state.name)}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: 10 }}
                        >
                          <i
                            className={`bi bi-${expandedStates.has(`${country.name}__${state.name}`) ? 'dash-lg' : 'plus-lg'}`}
                            style={{fontSize: 16, position: 'relative', top: 1, marginRight: 6}}
                          ></i>
                          <span>
                            {state.name}{' '}
                            <span className="fw-semibold">({state.total})</span>
                          </span>
                        </div>

                        {expandedStates.has(`${country.name}__${state.name}`) && (
                          <ul style={{ paddingLeft: 36, marginBottom: 16, listStyleType: 'circle' }}>
                            {Object.entries(state.cities)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([cityName, count]) => (
                                <li key={cityName} style={{marginBottom: 4}}>                                  
                                    {cityName}:{' '}
                                    <span className="fw-semibold">{count as never}</span>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <hr className="m-0 y-0" />
              </div>
            ))}
          </div>

        </div>
        <div className='d-flex justify-content-end mt-5 small'>
          Since Nov 13, 2025
        </div>
      </div>
    </div>
  )
}

export default AllVisitCard