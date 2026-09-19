export type Filter = {
  platform?: 'ios' | 'android' | null,
  model?: string | null,
  start?: string | null,
  end?: string | null,
  page?: number | null,
  size?: number | null,
  order?: 'asc' | 'desc' | null,
  uOrder?: 'asc' | 'desc' | null,
  vOrder?: 'asc' | 'desc' | null,
  visit?: 'returning' | 'oneTime' | null,
  visitBy?: 'today' | 'yesterday' | 'last_week' | 'all_time' | null,
  source?: 'auto' | 'manual' | 'all' | null,
  // User management filters
  role?: 'superadmin' | 'admin' | 'user' | null,
  provider?: 'google' | 'github' | 'linkedin' | 'microsoft' | 'apple' | null,
  active?: 0 | 1 | null,
  eOrder?: 'asc' | 'desc' | null,
  cOrder?: 'asc' | 'desc' | null,
  rOrder?: 'asc' | 'desc' | null,
}

export type FilterRate = {
  page?: number | null,
  size?: number | null,
  order?: 'asc' | 'desc' | null,
  sort: 'newest' | 'oldest' | 'lowest' | 'highest' | null,
  start?: string | null,
  end?: string | null,
  source?: 'auto' | 'manual' | 'all' | null,
}

type USVisitHeaderRow = [
  "State",
  "TotalVisits",
  {
    type: "string";
    role: "tooltip";
    p: {
      html: true;
    };
  }
];

type USVisitDataRow = [
  state: string,
  totalVisits: number,
  tooltipHtml: string
];

export type USVisitType = [
  USVisitHeaderRow,
  ...USVisitDataRow[]
];

export interface CityCounts {
  [cityName: string]: number;
}

export interface StateData {
  name: string;
  total: number;
  cities: CityCounts;
}

export interface CountryData {
  name: string;
  total: number;
  states: {
    [stateName: string]: StateData;
  };
}

export type CountriesResponse = CountryData[];