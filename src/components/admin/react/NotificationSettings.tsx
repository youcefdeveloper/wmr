import { useEffect, useState } from 'react'

// Browser notifications for new and returning app users. The choices belong
// to the dashboard account; each browser that should show them subscribes
// separately through the service worker.

type Prefs = { newUsers: boolean; returningUsers: boolean }
type Message = { kind: 'info' | 'error'; text: string } | null

const API = '/api/dashboard/notifications'
const SW_URL = '/admin-sw.js'
const SCOPE = '/dashboard/'

const supported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

// VAPID public keys are URL-safe base64; PushManager wants raw bytes.
function keyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

async function currentSubscription() {
  if (!supported()) return null
  const reg = await navigator.serviceWorker.getRegistration(SCOPE)
  return (await reg?.pushManager.getSubscription()) ?? null
}

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [vapidKey, setVapidKey] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await call<Prefs & { vapidPublicKey: string | null }>(API)
        setPrefs({ newUsers: data.newUsers, returningUsers: data.returningUsers })
        setVapidKey(data.vapidPublicKey)
        setSubscribed(!!(await currentSubscription()))
      } catch (err) {
        setMessage({ kind: 'error', text: `Couldn't load notification settings: ${(err as Error).message}` })
      }
    })()
  }, [])

  // Asks for permission and registers this browser. Throws with a message
  // the user can act on.
  async function subscribeThisBrowser() {
    if (!supported()) {
      throw new Error(
        "This browser can't show notifications. On iPhone, add the dashboard to your Home Screen first.",
      )
    }
    if (!vapidKey) throw new Error('Notifications are not configured on the server yet.')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notifications are blocked for this site. Allow them in your browser settings, then try again.')
    }
    await navigator.serviceWorker.register(SW_URL, { scope: SCOPE })
    const reg = await navigator.serviceWorker.ready
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(vapidKey),
      }))
    await call(`${API}/subscription`, 'POST', sub.toJSON())
    setSubscribed(true)
  }

  async function toggle(key: keyof Prefs, value: boolean) {
    if (!prefs) return
    const previous = prefs
    setPrefs({ ...prefs, [key]: value })
    setMessage(null)
    setBusy(true)
    try {
      if (value && !subscribed) await subscribeThisBrowser()
      setPrefs(await call<Prefs>(API, 'PUT', { [key]: value }))
    } catch (err) {
      setPrefs(previous)
      setMessage({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function enableHere() {
    setMessage(null)
    setBusy(true)
    try {
      await subscribeThisBrowser()
      setMessage({ kind: 'info', text: 'This browser will now receive notifications.' })
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function disableHere() {
    setMessage(null)
    setBusy(true)
    try {
      const sub = await currentSubscription()
      if (sub) {
        await call(`${API}/subscription`, 'DELETE', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setSubscribed(false)
      setMessage({ kind: 'info', text: 'This browser will no longer receive notifications.' })
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setMessage(null)
    setBusy(true)
    try {
      const { sent, subscriptions } = await call<{ sent: number; subscriptions: number }>(
        `${API}/test`,
        'POST',
        {},
      )
      setMessage(
        sent > 0
          ? { kind: 'info', text: `Test sent to ${sent} browser${sent === 1 ? '' : 's'}.` }
          : {
              kind: 'error',
              text: subscriptions
                ? "The test couldn't be delivered. Try turning this browser off and on again."
                : 'No browser is set up to receive notifications yet.',
            },
      )
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  if (!prefs) {
    return message ? <p className="small text-danger mb-0">{message.text}</p> : null
  }

  const anyOn = prefs.newUsers || prefs.returningUsers

  return (
    <>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          id="newUserNotification"
          checked={prefs.newUsers}
          disabled={busy}
          onChange={(e) => toggle('newUsers', e.target.checked)}
        />
        <label className="form-check-label small" htmlFor="newUserNotification">
          New User Events
        </label>
      </div>
      <div className="form-check form-switch mt-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="userReturnedNotification"
          checked={prefs.returningUsers}
          disabled={busy}
          onChange={(e) => toggle('returningUsers', e.target.checked)}
        />
        <label className="form-check-label small" htmlFor="userReturnedNotification">
          Returning User Events
        </label>
      </div>

      <div className="small mt-4 d-flex flex-wrap align-items-center gap-3">
        {subscribed ? (
          <>
            <span className="text-secondary">
              <i className="bi bi-bell me-1"></i>This browser receives notifications.
            </span>
            <button type="button" className="btn btn-link btn-sm p-0" disabled={busy} onClick={sendTest}>
              Send test
            </button>
            <button type="button" className="btn btn-link btn-sm p-0" disabled={busy} onClick={disableHere}>
              Stop on this browser
            </button>
          </>
        ) : (
          anyOn && (
            <>
              <span className="text-secondary">
                <i className="bi bi-bell-slash me-1"></i>This browser isn't set up.
              </span>
              <button type="button" className="btn btn-link btn-sm p-0" disabled={busy} onClick={enableHere}>
                Enable on this browser
              </button>
            </>
          )
        )}
      </div>

      {!vapidKey && (
        <p className="small text-danger mt-3 mb-0">
          The server can't send notifications yet: its VAPID keys are missing. Add them and restart the
          server.
        </p>
      )}

      {message && (
        <p className={`small mt-3 mb-0 ${message.kind === 'error' ? 'text-danger' : 'text-success'}`}>
          {message.text}
        </p>
      )}
    </>
  )
}

export default NotificationSettings
