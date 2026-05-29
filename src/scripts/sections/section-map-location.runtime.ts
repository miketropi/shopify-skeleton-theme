type MapContainer = HTMLElement & {
  __mapTeardown?: () => void
}

interface MapInitData {
  apiKey: string
  address: string
  zoom: number
  mapStyle: string
  embedMethod: string
}

function getData(container: HTMLElement): MapInitData {
  return {
    apiKey: container.dataset.mapApiKey || '',
    address: container.dataset.mapAddress || '',
    zoom: Number(container.dataset.mapZoom) || 14,
    mapStyle: container.dataset.mapStyle || 'default',
    embedMethod: container.dataset.embedMethod || 'javascript_api',
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function init(container: HTMLElement): void {
  const root = container as MapContainer
  const data = getData(container)
  const abort = new AbortController()
  const { signal } = abort

  if (data.embedMethod !== 'javascript_api') return
  if (!data.apiKey || !data.address) return

  const mapEl = container.querySelector<HTMLElement>('[data-maploc-map]')
  if (!mapEl) return

  // Load Google Maps script dynamically
  const scriptId = 'gmaps-script'
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(data.apiKey)}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  function bootMap(): void {
    if (!window.google?.maps) {
      // Retry once after a short delay
      setTimeout(bootMap, 300)
      return
    }

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: data.address }, (results, status) => {
      if (status !== 'OK' || !results || results.length === 0) return
      if (signal.aborted) return

      const location = results[0].geometry.location

      const mapOptions: google.maps.MapOptions = {
        center: location,
        zoom: data.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        ...(prefersReducedMotion() ? { gestureHandling: 'none' } : {}),
      }

      const map = new google.maps.Map(mapEl, mapOptions)

      new google.maps.Marker({
        map,
        position: location,
        title: data.address,
      })

      root.__mapTeardown = () => {
        // Google Maps doesn't have a proper destroy; clear references
        google.maps.event.clearInstanceListeners(map)
        abort.abort()
      }
    })
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootMap()
  } else {
    window.addEventListener('load', bootMap, { once: true, signal })
  }
}

export function destroy(container: HTMLElement): void {
  const root = container as MapContainer
  root.__mapTeardown?.()
  root.__mapTeardown = undefined
}