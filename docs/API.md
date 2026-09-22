# API

REST API under `/api/v1`, used by the mobile app and the admin dashboard.

The full reference (every parameter, schema and response, with "Try it out")
is the OpenAPI spec:

- **Swagger UI:** `/api-docs` (sign in to the dashboard first; logged-out
  visitors are redirected to the login page)
- **Spec:** `/api-docs/openapi.json` (404 when logged out), source in
  [`src/lib/openapi.ts`](../src/lib/openapi.ts)

This page covers the conventions and gives an overview.

## Authentication

Every request sends an API key in the `X-API-KEY` header:

| Key | Env var | Used for |
|:--|:--|:--|
| Default | `PUBLIC_API_KEY` | All endpoints except manual rates |
| Manual rates | `PUBLIC_API_KEY_WEEKLY_DATA_MANUAL` | `/us-weekly-data-manual` |

Both keys are shipped to the browser, so they identify the client rather than
protect data. Writes to rates and dashboard accounts also require a signed-in
dashboard session (the Auth.js cookie set by `/auth/login`) whose account has
the `admin` or `superadmin` role. `/auth/transfer-superadmin` requires
`superadmin`.

```sh
curl -H "X-API-KEY: $PUBLIC_API_KEY" https://<host>/api/v1/us-weekly-data/latest
```

## Conventions

- **JSON** everywhere, except the Excel upload (`multipart/form-data`).
- **Errors:** `{ "error": "message" }` with the HTTP status. Validation errors
  are `{ "errors": { "field": "message" } }` (400).

  | Status | Meaning |
  |:--|:--|
  | 400 | Invalid parameter or body |
  | 401 | Missing or wrong `X-API-KEY` |
  | 403 | No session / role too low / read-only record |
  | 404 | Unknown id |
  | 409 | Duplicate (week, email, superadmin) |
  | 429 | Rate limit (`register-push-token`: 10/min per IP) |

- **Pagination** (`/paging` and list endpoints with `page`/`size`):
  responses carry `page`, `size`, `total`, `pages`, `from`, `to` and `data`.
- **Dates:** weeks are `YYYY-MM-DD`. Timestamps are UTC: `YYYY-MM-DD HH:MM:SS`
  for devices and visits, ISO 8601 for dashboard accounts. On dashboard
  endpoints, `start`/`end` are whole days in US Eastern time.
- **Sorting:** `order=asc|desc`; the default is listed per endpoint.
- **CORS:** allowed for `localhost`, `*.weeklymortgagerates.org` and
  `wmr-ui-demo.vercel.app`.

## Endpoints

### Rates (public site, mobile app)

| Method | Path | Description |
|:--|:--|:--|
| GET | `/us-weekly-data` | All weeks: 30/15-year rates |
| GET | `/us-weekly-data/latest` | Most recent week |
| GET | `/us-weekly-data/{year}` | Weeks of one year |
| GET | `/us-weekly-data/range?start=&end=` | Weeks between two dates |
| GET | `/us-weekly-data/paging` | Paginated weeks (`sort=newest\|oldest\|lowest\|highest`, `source`, `start`, `end`) |
| GET | `/us-yearly-data` | Yearly averages |
| GET | `/weekly-data` | All weeks with every Freddie Mac column (fees, 5/1 ARM, spread) |

`us15_yr_frm` is `null` before 1991.

```json
{ "id": 2895, "week": "2026-09-17", "us30_yr_frm": 6.95, "us15_yr_frm": 6.26, "source": "auto" }
```

### Manual rates (dashboard, manual key)

| Method | Path | Description |
|:--|:--|:--|
| GET | `/us-weekly-data-manual` | Manual entries, newest first |
| POST | `/us-weekly-data-manual` | Create `{ week, us30YrFrm, us15YrFrm }` (session) |
| GET | `/us-weekly-data-manual/{id}` | One entry |
| PUT/PATCH | `/us-weekly-data-manual/{id}` | Update sent fields (session) |
| DELETE | `/us-weekly-data-manual/{id}` | Delete (session) |

Imported (`source: auto`) weeks can't be changed or deleted (403), and a week
can exist only once (409).

### Import and notifications

| Method | Path | Description |
|:--|:--|:--|
| POST | `/import-excel?url=…&push=yes\|no` | Import new weeks from a Freddie Mac workbook (URL, or `file` upload) |
| POST | `/push-notification` | Broadcast `{ title?, subtitle, body }` to every iOS/Android device |

The import only adds missing weeks. With `push=yes` it notifies users about
the newest week, once per week.

The same import also runs on a schedule at `GET /api/cron/import-rates`
(outside `/api/v1`). It is authenticated with `Authorization: Bearer
$CRON_SECRET` instead of an API key, because Vercel Cron cannot send custom
headers, and accepts `?push=no` and `?url=`. From the command line:
`npm run import:rates`.

### Devices (mobile app installs)

| Method | Path | Description |
|:--|:--|:--|
| POST | `/register-push-token` | Called on app launch: registers the device or records a visit |
| GET | `/users` | All devices (`platform`, `start`, `end`) |
| GET | `/users/paging` | Paginated devices (`platform`, `model`, `visit`, `visitBy`, `uOrder`, `vOrder`) |
| GET | `/users/stats` | Installs, returning devices and visits per platform |
| GET | `/users/stats-by-model` | Installs per platform and model |
| GET | `/users/comeback-range?start=&end=` | Visits and daily unique devices in a range |

`register-push-token` body:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceId": "7177ec70-9cfd-4007-b3be-91fd79cae848",
  "platform": "ios",
  "model": "iPhone16,1",
  "ipAddress": "203.0.113.10",
  "lang": "en"
}
```

`token`, `deviceId` (36-character UUID) and `platform` are required.

### Visits

| Method | Path | Description |
|:--|:--|:--|
| GET | `/users/{id}/update-history` | Paginated visits of a device (`source`, `start`, `end`) |
| GET | `/users/{id}/update-history/all` | All visits of a device |
| GET | `/update-history/location-stats` | Visits by country → state → city (`country`) |
| GET | `/update-history/us-states-chart` | US visits by state as Google GeoChart rows (`city-order`) |

### Dashboard accounts

| Method | Path | Description |
|:--|:--|:--|
| GET | `/auth/initializer` | Providers, roles and allowed emails |
| GET | `/auth/stats` | Active accounts per role |
| GET | `/auth/users` | Paginated accounts (`role`, `provider`, `active`, sort params) |
| POST | `/auth/users` | Create (session) |
| GET | `/auth/users/find-by-email?email=` | Look up by email (case-insensitive) |
| GET | `/auth/users/{id}` | One account |
| PUT/PATCH | `/auth/users/{id}` | Update (session; admins can only assign `admin`) |
| DELETE | `/auth/users/{id}` | Delete (session) |
| POST | `/auth/transfer-superadmin/{id}` | Hand the superadmin role to another account (superadmin session) |

The superadmin account can't be edited or deleted. Sign-in is allowed only
for active accounts, and only with one of the account's `providers`.

## Changing the API

Routes live in `src/pages/api/v1` and only parse input. The logic is in
`src/lib/server/*`. When you add or change an endpoint, update
`src/lib/openapi.ts` in the same change.
