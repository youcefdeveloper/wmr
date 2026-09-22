// Service worker for dashboard browser notifications. Registered by My
// Account with scope /dashboard/, so it never touches the public site. It
// only shows pushes; it does not cache or intercept requests.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'WMR Dashboard', {
      body: data.body || '',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-48x48.png',
      data: { url: data.url || '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin)
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Reuse an open dashboard tab rather than piling up new ones.
      const tab = tabs.find((c) => new URL(c.url).pathname.startsWith('/dashboard'))
      if (tab) {
        await tab.focus()
        return tab.navigate(url.href)
      }
      return self.clients.openWindow(url.href)
    })(),
  )
})
