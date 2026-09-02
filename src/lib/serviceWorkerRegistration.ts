/**
 * Service Worker Registration & Lifecycle Management
 * In dev/dynamic web container environment, unregister any stale SW to prevent React module duplication
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  // Purge any registered service worker to prevent split module/hook cache conflicts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  // Clear stale caches if available
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).catch(() => {});
      }
    }).catch(() => {});
  }
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

