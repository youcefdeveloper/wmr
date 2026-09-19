// OpenAPI 3.0 description of /api/v1, served at /api-docs/openapi.json and
// rendered by the Swagger UI page at /api-docs. Keep in sync with
// src/pages/api/v1 and the services in src/lib/server.

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema: object, example?: unknown) => ({
  'application/json': { schema, ...(example === undefined ? {} : { example }) },
})
const ok = (description: string, schema: object, example?: unknown) => ({
  description,
  content: json(schema, example),
})
const error = (description: string, example = 'Error message') => ({
  description,
  content: json(ref('Error'), { error: example }),
})

const errors = {
  401: error('Missing or wrong `X-API-KEY`.', 'Unauthorized'),
}
const sessionErrors = {
  ...errors,
  403: error(
    'No dashboard session, or the signed-in account lacks the required role.',
    'Forbidden: Only superadmin or admin can update users.',
  ),
}

const query = (
  name: string,
  description: string,
  schema: object = { type: 'string' },
  required = false,
) => ({ name, in: 'query', required, description, schema })
const path = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer' },
})

const order = (fallback: 'asc' | 'desc') =>
  query('order', `Sort direction (default \`${fallback}\`).`, {
    type: 'string',
    enum: ['asc', 'desc'],
    default: fallback,
  })
const page = query('page', 'Page number, starting at 1.', {
  type: 'integer',
  minimum: 1,
  default: 1,
})
const size = (max?: number) =>
  query('size', `Items per page${max ? ` (max ${max})` : ''}.`, {
    type: 'integer',
    minimum: 1,
    ...(max ? { maximum: max } : {}),
    default: 10,
  })
const easternDate = (name: 'start' | 'end') =>
  query(
    name,
    `${name === 'start' ? 'From' : 'Until'} this day (inclusive), \`YYYY-MM-DD\`, interpreted in US Eastern time.`,
    { type: 'string', format: 'date' },
  )

const MANUAL_KEY = [{ ManualApiKey: [] }]
const SESSION = [{ ApiKey: [], DashboardSession: [] }]
const MANUAL_SESSION = [{ ManualApiKey: [], DashboardSession: [] }]

const weeklyRateExample = {
  id: 2895,
  week: '2026-09-17',
  us30_yr_frm: 6.95,
  us15_yr_frm: 6.26,
  source: 'auto',
}
const deviceExample = {
  id: 348,
  deviceId: '7177ec70-9cfd-4007-b3be-91fd79cae848',
  platform: 'android',
  model: 'Pixel 8',
  ipAddress: '203.0.113.10',
  location: 'Oakville, Ontario, Canada',
  lang: 'en',
  language: 'English',
  notify: false,
  createdAt: '2026-09-19 14:56:52',
  updatedAt: '2026-09-19 14:56:52',
  pushTokens: [
    {
      id: 348,
      createdAt: '2026-09-19 14:56:52',
      updatedAt: '2026-09-19 14:56:52',
      updatedAtHistoryCount: 0,
    },
  ],
}
const authUserExample = {
  id: 8,
  email: 'admin@example.com',
  name: 'Jane Admin',
  role: 'admin',
  providers: ['google', 'github'],
  isActive: true,
  createdAt: '2025-11-09T10:30:00+00:00',
  updatedAt: '2025-11-09T15:45:00+00:00',
}
const paged = (item: object) => ({
  allOf: [ref('Pagination'), { type: 'object', properties: { data: { type: 'array', items: item } } }],
})

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Weekly Mortgage Rates API',
    version: '1.0.0',
    description: [
      'Rates, device and dashboard API used by the mobile app and the admin dashboard.',
      '',
      '- Every request needs the `X-API-KEY` header. The manual-rates endpoints use a separate key.',
      '- Write endpoints for rates and dashboard accounts also need a signed-in dashboard session (Auth.js cookie) with the `admin` or `superadmin` role.',
      '- Errors are JSON: `{ "error": "…" }`, or `{ "errors": { field: message } }` for validation failures.',
      '- Date-times are UTC. `start`/`end` filters on dashboard endpoints are whole days in US Eastern time.',
    ].join('\n'),
  },
  servers: [{ url: '/api/v1', description: 'This deployment' }],
  security: [{ ApiKey: [] }],
  tags: [
    { name: 'Rates', description: 'Freddie Mac PMMS weekly and yearly rates (public site + mobile app).' },
    { name: 'Manual rates', description: 'Rates entered by hand in the dashboard.' },
    { name: 'Import & notifications', description: 'Excel import and Expo push broadcasts.' },
    { name: 'Devices', description: 'Mobile app installs, registration and visit statistics.' },
    { name: 'Visits', description: 'Per-device visit history and location reports.' },
    { name: 'Dashboard accounts', description: 'Accounts allowed to sign in to the dashboard.' },
  ],
  components: {
    securitySchemes: {
      ApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'Value of `PUBLIC_API_KEY`.',
      },
      ManualApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'Value of `PUBLIC_API_KEY_WEEKLY_DATA_MANUAL` (manual-rates endpoints only).',
      },
      DashboardSession: {
        type: 'apiKey',
        in: 'cookie',
        name: 'authjs.session-token',
        description: 'Auth.js session cookie set by signing in at /auth/login (`__Secure-` prefixed over HTTPS).',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      ValidationErrors: {
        type: 'object',
        properties: {
          errors: {
            description: 'Field → message map (or a list of `{ field, message }` for device validation).',
            oneOf: [
              { type: 'object', additionalProperties: { type: 'string' } },
              {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            ],
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          size: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 335 },
          pages: { type: 'integer', example: 34 },
          from: { type: 'integer', description: '1-based index of the first item (0 when empty).', example: 1 },
          to: { type: 'integer', description: 'Index of the last item (0 when empty).', example: 10 },
        },
      },
      WeeklyRate: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          week: { type: 'string', format: 'date', description: 'Thursday of the survey week.' },
          us30_yr_frm: { type: 'number', nullable: true, description: '30-year fixed rate (%).' },
          us15_yr_frm: {
            type: 'number',
            nullable: true,
            description: '15-year fixed rate (%). Null before 1991.',
          },
          source: { type: 'string', enum: ['auto', 'manual'] },
        },
        example: weeklyRateExample,
      },
      WeeklyRateFull: {
        allOf: [
          ref('WeeklyRate'),
          {
            type: 'object',
            properties: {
              thirty_yr_fees_points: { type: 'number', nullable: true },
              fifteen_yr_fees_points: { type: 'number', nullable: true },
              us5_1_arm: { type: 'number', nullable: true },
              five_1_fees_points: { type: 'number', nullable: true },
              five_1_arm_margin: { type: 'number', nullable: true },
              us30_yr_frm5_1_arm_spread: { type: 'number', nullable: true },
            },
          },
        ],
      },
      YearlyRate: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Row number (1 = oldest year).' },
          year: { type: 'string', example: '2025' },
          us30_yr_frm: { type: 'number', nullable: true, description: 'Average of the weekly rates, 2 decimals.' },
          us15_yr_frm: { type: 'number', nullable: true },
        },
        example: { id: 55, year: '2025', us30_yr_frm: 6.63, us15_yr_frm: 5.77 },
      },
      ManualRate: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          week: { type: 'string', format: 'date' },
          us30YrFrm: { type: 'number', nullable: true },
          us15YrFrm: { type: 'number', nullable: true },
          source: { type: 'string', enum: ['manual'] },
        },
        example: { id: 2898, week: '2030-01-03', us30YrFrm: 6.12, us15YrFrm: 5.2, source: 'manual' },
      },
      ManualRateInput: {
        type: 'object',
        properties: {
          week: { type: 'string', format: 'date', example: '2030-01-03' },
          us30YrFrm: { type: 'number', minimum: 0, maximum: 100, example: 6.12, description: 'Rounded to 3 decimals.' },
          us15YrFrm: { type: 'number', minimum: 0, maximum: 100, example: 5.2 },
        },
      },
      Device: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          deviceId: { type: 'string', format: 'uuid' },
          platform: { type: 'string', enum: ['ios', 'android', 'web', 'macos', 'windows'] },
          model: { type: 'string', nullable: true },
          ipAddress: { type: 'string', nullable: true, description: 'IP at first registration.' },
          location: { type: 'string', nullable: true, description: 'City, State, Country from GeoIP, or "Local Network".' },
          lang: { type: 'string' },
          language: { type: 'string' },
          notify: { type: 'boolean' },
          createdAt: { type: 'string', example: '2026-09-19 14:56:52', description: 'UTC, `YYYY-MM-DD HH:MM:SS`.' },
          updatedAt: { type: 'string', description: 'Last app launch (UTC).' },
          pushTokens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                updatedAtHistoryCount: { type: 'integer', description: 'Number of recorded visits of the device.' },
              },
            },
          },
        },
        example: deviceExample,
      },
      Visit: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          updatedAt: { type: 'string', example: '2025-07-08 23:00:54', description: 'UTC.' },
          source: { type: 'string', example: 'register-push-token' },
          ipAddress: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          lang: { type: 'string', nullable: true, example: 'fr' },
          language: { type: 'string', nullable: true, example: 'French' },
        },
      },
      PeriodCounts: {
        type: 'object',
        properties: {
          today: { type: 'integer' },
          yesterday: { type: 'integer' },
          last_week: { type: 'integer', description: 'Today and the 6 previous days.' },
          all_time: { type: 'integer' },
        },
      },
      DeviceStats: {
        type: 'object',
        properties: {
          platform: { type: 'string', description: 'Platform, or `all` for the totals row (always last).' },
          total: { type: 'integer', description: 'Installs.' },
          returning: { type: 'integer', description: 'Installs that opened the app again after registering.' },
          oneTime: { type: 'integer' },
          comeback: {
            type: 'object',
            properties: {
              session: { allOf: [ref('PeriodCounts')], description: 'Number of visits.' },
              user: {
                allOf: [ref('PeriodCounts')],
                description: 'Unique devices per day, summed over the period (all_time: unique devices).',
              },
            },
          },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['superadmin', 'admin', 'user'] },
          providers: {
            type: 'array',
            items: { type: 'string', enum: ['google', 'github', 'linkedin', 'microsoft', 'apple'] },
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: authUserExample,
      },
      AuthUserInput: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          role: { type: 'string', enum: ['admin', 'user'], description: '`superadmin` only via transfer.' },
          isActive: { type: 'boolean', default: true },
          providers: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', enum: ['google', 'github', 'linkedin', 'microsoft', 'apple'] },
            description: 'Sign-in methods allowed for this email. Unknown values are dropped.',
          },
        },
        example: { email: 'jane@example.com', name: 'Jane Admin', role: 'admin', providers: ['google'] },
      },
    },
  },
  paths: {
    // ---------------------------------------------------------------- Rates
    '/us-weekly-data': {
      get: {
        tags: ['Rates'],
        summary: 'All weekly 30/15-year rates',
        parameters: [order('asc')],
        responses: { 200: ok('Every week since 1971.', { type: 'array', items: ref('WeeklyRate') }), ...errors },
      },
    },
    '/us-weekly-data/latest': {
      get: {
        tags: ['Rates'],
        summary: 'Most recent week',
        responses: {
          200: ok('Latest week.', ref('WeeklyRate'), weeklyRateExample),
          404: { description: 'No data yet.', content: json({ type: 'object' }, { message: 'No data found' }) },
          ...errors,
        },
      },
    },
    '/us-weekly-data/{year}': {
      get: {
        tags: ['Rates'],
        summary: 'Weekly rates of one year',
        parameters: [path('year', 'Calendar year, e.g. 2025.'), order('asc')],
        responses: { 200: ok('Weeks of the year.', { type: 'array', items: ref('WeeklyRate') }), ...errors },
      },
    },
    '/us-weekly-data/range': {
      get: {
        tags: ['Rates'],
        summary: 'Weekly rates between two dates',
        parameters: [
          query('start', 'First day (inclusive), `YYYY-MM-DD`.', { type: 'string', format: 'date' }, true),
          query('end', 'Last day (inclusive), `YYYY-MM-DD`.', { type: 'string', format: 'date' }, true),
          order('asc'),
        ],
        responses: {
          200: ok('Weeks in range.', { type: 'array', items: ref('WeeklyRate') }),
          400: error('Missing or invalid date.', 'Missing start or end date'),
          ...errors,
        },
      },
    },
    '/us-weekly-data/paging': {
      get: {
        tags: ['Rates'],
        summary: 'Paginated weekly rates (dashboard)',
        parameters: [
          page,
          size(),
          query('sort', 'Overrides `order`.', { type: 'string', enum: ['newest', 'oldest', 'lowest', 'highest'] }),
          order('desc'),
          query('start', 'From this week (inclusive).', { type: 'string', format: 'date' }),
          query('end', 'Until this week (inclusive).', { type: 'string', format: 'date' }),
          query('source', '`auto`, `manual`, or `all`.', { type: 'string', enum: ['all', 'auto', 'manual'] }),
        ],
        responses: {
          200: ok('Page of weeks.', paged(ref('WeeklyRate'))),
          400: error('Invalid date.', 'Invalid start date format'),
          ...errors,
        },
      },
    },
    '/us-yearly-data': {
      get: {
        tags: ['Rates'],
        summary: 'Yearly averages',
        parameters: [order('asc')],
        responses: { 200: ok('One row per year.', { type: 'array', items: ref('YearlyRate') }), ...errors },
      },
    },
    '/weekly-data': {
      get: {
        tags: ['Rates'],
        summary: 'All weekly data, every Freddie Mac column',
        parameters: [order('asc')],
        responses: { 200: ok('Every week.', { type: 'array', items: ref('WeeklyRateFull') }), ...errors },
      },
    },

    // --------------------------------------------------------- Manual rates
    '/us-weekly-data-manual': {
      get: {
        tags: ['Manual rates'],
        summary: 'List manual entries',
        security: MANUAL_KEY,
        responses: { 200: ok('Newest first.', { type: 'array', items: ref('ManualRate') }), ...errors },
      },
      post: {
        tags: ['Manual rates'],
        summary: 'Create a manual entry',
        security: MANUAL_SESSION,
        requestBody: { required: true, content: json(ref('ManualRateInput')) },
        responses: {
          201: ok('Created.', ref('ManualRate')),
          400: error('Invalid week or rate.', '"30 Yr. Fixed" value must be between 0 and 100'),
          409: error('That week already exists.', 'The entry for this week already exists'),
          ...sessionErrors,
        },
      },
    },
    '/us-weekly-data-manual/{id}': {
      parameters: [path('id', 'Weekly data id.')],
      get: {
        tags: ['Manual rates'],
        summary: 'Get a manual entry',
        security: MANUAL_KEY,
        responses: { 200: ok('Entry.', ref('ManualRate')), 404: error('Not found or not manual.', 'Not found'), ...errors },
      },
      put: {
        tags: ['Manual rates'],
        summary: 'Update a manual entry',
        description: 'Only the fields sent are changed. `PATCH` behaves the same.',
        security: MANUAL_SESSION,
        requestBody: { required: true, content: json(ref('ManualRateInput')) },
        responses: {
          200: ok('Updated.', ref('ManualRate')),
          400: error('Invalid value.'),
          404: error('Not found.', 'Not found'),
          409: error('Week taken by another entry.', 'The entry for this week already exists'),
          ...sessionErrors,
          403: error('Imported (`auto`) entries cannot be changed, or missing role.', 'Cannot update auto source entries'),
        },
      },
      delete: {
        tags: ['Manual rates'],
        summary: 'Delete a manual entry',
        security: MANUAL_SESSION,
        responses: {
          200: ok('Deleted.', { type: 'object' }, {
            status: 'deleted',
            message: 'Manual weekly data entry with id 2898 and week 2030-01-03 has been deleted.',
            id: 2898,
            week: '2030-01-03',
          }),
          404: error('Not found.', 'Not found'),
          ...sessionErrors,
          403: error('Imported (`auto`) entries cannot be deleted, or missing role.', 'Cannot delete auto source entries'),
        },
      },
    },

    // ----------------------------------------------- Import & notifications
    '/import-excel': {
      post: {
        tags: ['Import & notifications'],
        summary: 'Import new weeks from a Freddie Mac PMMS workbook',
        description:
          'Adds weeks that are not in the database yet (existing weeks are never changed). With `push=yes`, app users are notified of the newest imported week unless they were already notified about it.',
        parameters: [
          query('url', 'Workbook URL, e.g. https://www.freddiemac.com/pmms/docs/historicalweeklydata.xlsx. Omit when uploading a file.'),
          query('push', 'Send a push notification for the newest week.', { type: 'string', enum: ['yes', 'no'], default: 'no' }),
        ],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: {
          200: ok('Import result.', { type: 'object' }, {
            success: true,
            imported: true,
            newRates: [{ us30_yr_frm: 6.95, us15_yr_frm: 6.26, date: '2026-09-17T00:00:00+00:00' }],
            notification: { sent: true, message: 'Push notification sent.' },
          }),
          500: {
            description: 'Download or parsing failed, or no source given.',
            content: json({ type: 'object' }, { success: false, error: 'Import failed: No source provided for Excel import.' }),
          },
          ...errors,
        },
      },
    },
    '/push-notification': {
      post: {
        tags: ['Import & notifications'],
        summary: 'Broadcast a push notification to every iOS/Android device',
        description: 'Sent through Expo in batches of 100. On Android the subtitle is appended to the title.',
        requestBody: {
          required: true,
          content: json(
            {
              type: 'object',
              required: ['subtitle', 'body'],
              properties: {
                title: { type: 'string', default: 'U.S. Weekly Average' },
                subtitle: { type: 'string' },
                body: { type: 'string' },
              },
            },
            { title: 'U.S. Weekly Average', subtitle: 'Sep 17, 2026', body: '30 Yr. Fixed: 6.95% | 15 Yr. Fixed: 6.26%' },
          ),
        },
        responses: {
          200: ok('Broadcast finished.', { type: 'object' }, {
            success: true,
            message: 'Push notification sent.',
            recipients: 335,
            skipped: 0,
            failedBatches: 0,
          }),
          400: {
            description: 'Missing subtitle or body.',
            content: json({ type: 'object' }, {
              success: false,
              error: 'Missing required fields: title, subtitle, and body are required.',
            }),
          },
          ...errors,
        },
      },
    },

    // -------------------------------------------------------------- Devices
    '/register-push-token': {
      post: {
        tags: ['Devices'],
        summary: 'Register a device / record an app launch',
        description:
          'Called by the mobile app on launch. Creates the device on first call; afterwards records a visit (with IP and language) and updates the model and push token. Limited to 10 calls per minute per IP.',
        requestBody: {
          required: true,
          content: json(
            {
              type: 'object',
              required: ['token', 'deviceId', 'platform'],
              properties: {
                token: { type: 'string', maxLength: 255, description: 'Expo push token.' },
                deviceId: { type: 'string', format: 'uuid' },
                platform: { type: 'string', enum: ['ios', 'android', 'web', 'macos', 'windows'] },
                model: { type: 'string', maxLength: 50 },
                ipAddress: { type: 'string', description: 'Public IP (ignored for visits if not a valid IP).' },
                lang: { type: 'string', description: 'App language code, e.g. `en`, `fr`, `ar`.' },
              },
            },
            {
              token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
              deviceId: '7177ec70-9cfd-4007-b3be-91fd79cae848',
              platform: 'ios',
              model: 'iPhone16,1',
              ipAddress: '203.0.113.10',
              lang: 'en',
            },
          ),
        },
        responses: {
          200: ok('Registered.', { type: 'object' }, { success: true }),
          400: { description: 'Invalid input.', content: json(ref('ValidationErrors'), { errors: { deviceId: 'Invalid device ID format.' } }) },
          429: error('More than 10 calls in a minute from this IP.', 'Too many requests'),
          ...errors,
        },
      },
    },
    '/users': {
      get: {
        tags: ['Devices'],
        summary: 'All devices',
        parameters: [
          query('platform', 'Filter by platform.'),
          query('start', 'Registered at or after (UTC date or date-time).'),
          query('end', 'Registered at or before (UTC date or date-time).'),
          order('asc'),
        ],
        responses: { 200: ok('Devices by registration date.', { type: 'array', items: ref('Device') }), ...errors },
      },
    },
    '/users/paging': {
      get: {
        tags: ['Devices'],
        summary: 'Paginated devices (dashboard)',
        parameters: [
          page,
          size(),
          query('platform', 'Platform, or `all`.'),
          query('model', 'Device model, `unknown` (no model) or `all`.'),
          query('visit', '`returning` (visited again), `onetime`, or `all`.', { type: 'string', enum: ['all', 'returning', 'onetime'] }),
          query(
            'visitBy',
            'Only devices that visited in the period (Eastern time). `last_week` lists one row per device per day it visited.',
            { type: 'string', enum: ['today', 'yesterday', 'last_week', 'all_time'] },
          ),
          easternDate('start'),
          easternDate('end'),
          order('desc'),
          query('uOrder', 'Sort by last push-token update.', { type: 'string', enum: ['asc', 'desc'] }),
          query('vOrder', 'Sort by number of visits (applied before `uOrder`).', { type: 'string', enum: ['asc', 'desc'] }),
        ],
        responses: { 200: ok('Page of devices.', paged(ref('Device'))), 400: error('Invalid date.'), ...errors },
      },
    },
    '/users/stats': {
      get: {
        tags: ['Devices'],
        summary: 'Installs and comeback statistics per platform',
        responses: { 200: ok('One row per platform, then `all`.', { type: 'array', items: ref('DeviceStats') }), ...errors },
      },
    },
    '/users/stats-by-model': {
      get: {
        tags: ['Devices'],
        summary: 'Installs per platform and model',
        responses: {
          200: ok(
            'Keyed by platform.',
            {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'object', properties: { model: { type: 'string' }, total: { type: 'integer' } } },
              },
            },
            { android: [{ model: 'Unknown', total: 3 }, { model: 'Pixel 8', total: 2 }], ios: [{ model: 'iPhone16,1', total: 12 }] },
          ),
          ...errors,
        },
      },
    },
    '/users/comeback-range': {
      get: {
        tags: ['Devices'],
        summary: 'Visits between two days',
        parameters: [
          query('start', 'First day (Eastern), `YYYY-MM-DD`.', { type: 'string', format: 'date' }, true),
          query('end', 'Last day (Eastern), `YYYY-MM-DD`.', { type: 'string', format: 'date' }, true),
        ],
        responses: {
          200: ok('Visits (`session`) and unique devices per day summed (`user`).', { type: 'object' }, {
            session: { all: 128, ios: 67, android: 61 },
            user: { all: 109, ios: 59, android: 50 },
          }),
          400: error('Missing or invalid date.', 'Missing start or end date'),
          ...errors,
        },
      },
    },

    // --------------------------------------------------------------- Visits
    '/users/{id}/update-history': {
      get: {
        tags: ['Visits'],
        summary: 'Paginated visits of a device',
        parameters: [
          path('id', 'Device id.'),
          page,
          size(100),
          order('desc'),
          query('source', 'Visit source (default `register-push-token`), or `all`.'),
          easternDate('start'),
          easternDate('end'),
        ],
        responses: {
          200: ok('Device summary, pagination, applied filter and visits.', {
            allOf: [
              ref('Pagination'),
              {
                type: 'object',
                properties: {
                  userId: { type: 'integer' },
                  deviceId: { type: 'string' },
                  platform: { type: 'string' },
                  model: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  filter: { type: 'object' },
                  data: { type: 'array', items: ref('Visit') },
                },
              },
            ],
          }),
          404: error('Unknown device.', 'User not found'),
          ...errors,
        },
      },
    },
    '/users/{id}/update-history/all': {
      get: {
        tags: ['Visits'],
        summary: 'All visits of a device',
        parameters: [
          path('id', 'Device id.'),
          order('desc'),
          query('source', 'Visit source (default `register-push-token`), or `all`.'),
          easternDate('start'),
          easternDate('end'),
        ],
        responses: {
          200: ok('Same as the paginated version, with `total` instead of pagination.', { type: 'object' }),
          404: error('Unknown device.', 'User not found'),
          ...errors,
        },
      },
    },
    '/update-history/location-stats': {
      get: {
        tags: ['Visits'],
        summary: 'Visits by country → state → city',
        description: 'Counts every visit plus each device registration. "Unknown" entries come last.',
        parameters: [query('country', 'Only this country (case-insensitive).')],
        responses: {
          200: ok('Countries.', { type: 'array', items: { type: 'object' } }, [
            {
              name: 'Algeria',
              total: 10,
              states: {
                Algiers: { name: 'Algiers', total: 3, cities: { Algiers: 2, Rouiba: 1 } },
                Blida: { name: 'Blida', total: 7, cities: { Blida: 7 } },
              },
            },
          ]),
          ...errors,
        },
      },
    },
    '/update-history/us-states-chart': {
      get: {
        tags: ['Visits'],
        summary: 'US visits by state (Google GeoChart rows)',
        parameters: [
          query('city-order', 'Order of cities in the tooltip.', { type: 'string', enum: ['alphabetic', 'count'], default: 'alphabetic' }),
        ],
        responses: {
          200: ok('Header row, then `[state, visits, tooltipHtml]` per state.', { type: 'array', items: { type: 'array' } }, [
            ['State', 'Total Visits', { type: 'string', role: 'tooltip', p: { html: true } }],
            ['Alabama', 11, '<div …>Total Visits (11)<ul …><li>Birmingham: 8</li>…</ul></div>'],
          ]),
          ...errors,
        },
      },
    },

    // --------------------------------------------------- Dashboard accounts
    '/auth/initializer': {
      get: {
        tags: ['Dashboard accounts'],
        summary: 'Providers, roles and allowed emails',
        responses: {
          200: ok('Form options.', { type: 'object' }, {
            providers: [{ name: 'Google', value: 'google' }],
            roles: [{ name: 'Superadmin', value: 'superadmin' }, { name: 'Admin', value: 'admin' }, { name: 'User', value: 'user' }],
            allowed_emails: 'admin@example.com,jane@example.com',
          }),
          ...errors,
        },
      },
    },
    '/auth/stats': {
      get: {
        tags: ['Dashboard accounts'],
        summary: 'Active accounts per role',
        responses: {
          200: ok('Counts.', { type: 'object' }, { totalUsers: 5, roleDistribution: { superadmin: 1, admin: 3, user: 1 } }),
          ...errors,
        },
      },
    },
    '/auth/users': {
      get: {
        tags: ['Dashboard accounts'],
        summary: 'Paginated accounts',
        description: 'Sort with one of `uOrder` (name), `eOrder` (email), `cOrder` (created), `rOrder` (role); default oldest first.',
        parameters: [
          page,
          size(100),
          query('role', 'Filter by role.', { type: 'string', enum: ['superadmin', 'admin', 'user'] }),
          query('provider', 'Accounts allowed to use this provider.'),
          query('active', '`1`/`true` for active, anything else for inactive.'),
          easternDate('start'),
          easternDate('end'),
          query('uOrder', 'Sort by name.', { type: 'string', enum: ['asc', 'desc'] }),
          query('eOrder', 'Sort by email.', { type: 'string', enum: ['asc', 'desc'] }),
          query('cOrder', 'Sort by creation date.', { type: 'string', enum: ['asc', 'desc'] }),
          query('rOrder', 'Sort by role.', { type: 'string', enum: ['asc', 'desc'] }),
        ],
        responses: { 200: ok('Page of accounts.', paged(ref('AuthUser'))), ...errors },
      },
      post: {
        tags: ['Dashboard accounts'],
        summary: 'Create an account',
        description: 'Requires an `admin` or `superadmin` session.',
        security: SESSION,
        requestBody: { required: true, content: json(ref('AuthUserInput')) },
        responses: {
          201: ok('Created.', ref('AuthUser')),
          400: { description: 'Invalid input or no provider.', content: json(ref('ValidationErrors')) },
          409: error('Email already used (case-insensitive), or a second superadmin.', 'User with this email already exists'),
          ...sessionErrors,
        },
      },
    },
    '/auth/users/find-by-email': {
      get: {
        tags: ['Dashboard accounts'],
        summary: 'Find an account by email',
        parameters: [query('email', 'Email (case-insensitive).', { type: 'string', format: 'email' }, true)],
        responses: {
          200: ok('Account.', ref('AuthUser'), authUserExample),
          400: error('Missing or invalid email.', 'Email parameter is required'),
          404: error('No account.', 'User not found'),
          ...errors,
        },
      },
    },
    '/auth/users/{id}': {
      parameters: [path('id', 'Account id.')],
      get: {
        tags: ['Dashboard accounts'],
        summary: 'Get an account',
        responses: { 200: ok('Account.', ref('AuthUser')), 404: error('Not found.', 'User not found'), ...errors },
      },
      put: {
        tags: ['Dashboard accounts'],
        summary: 'Update an account',
        description:
          'Only the fields sent are changed; `PATCH` behaves the same. Requires an `admin` or `superadmin` session; admins can only set the `admin` role. The superadmin account cannot be edited.',
        security: SESSION,
        requestBody: { required: true, content: json(ref('AuthUserInput')) },
        responses: {
          200: ok('Updated.', ref('AuthUser')),
          400: { description: 'Invalid input.', content: json(ref('ValidationErrors')) },
          404: error('Not found.', 'User not found'),
          409: error('Email already used.', 'User with this email already exists'),
          ...sessionErrors,
        },
      },
      delete: {
        tags: ['Dashboard accounts'],
        summary: 'Delete an account',
        description: 'Requires an `admin` or `superadmin` session. The superadmin account cannot be deleted.',
        security: SESSION,
        responses: {
          200: ok('Deleted.', { type: 'object' }, { message: 'User deleted successfully' }),
          404: error('Not found.', 'User not found'),
          ...sessionErrors,
        },
      },
    },
    '/auth/transfer-superadmin/{id}': {
      post: {
        tags: ['Dashboard accounts'],
        summary: 'Make another account the superadmin',
        description: 'Requires the `superadmin` session. The current superadmin becomes `admin`.',
        security: SESSION,
        parameters: [path('id', 'Active account to promote.')],
        responses: {
          200: ok('Transferred.', { type: 'object' }, {
            message: 'Superadmin privileges transferred successfully',
            previousSuperadmin: { id: 8, email: 'owner@example.com', name: 'Owner', newRole: 'admin' },
            newSuperadmin: { id: 15, email: 'jane@example.com', name: 'Jane Admin', role: 'superadmin' },
          }),
          400: error('Already superadmin or inactive.', 'User is already superadmin'),
          404: error('Unknown account.', 'Target user not found'),
          ...sessionErrors,
        },
      },
    },
  },
} as const
