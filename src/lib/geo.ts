export type Coordinates = {
  latitude: number
  longitude: number
}

const knownLocationCoordinates: Record<string, Coordinates> = {
  'san francisco': { latitude: 37.7749, longitude: -122.4194 },
  'sf': { latitude: 37.7749, longitude: -122.4194 },
  'oakland': { latitude: 37.8044, longitude: -122.2712 },
  'berkeley': { latitude: 37.8715, longitude: -122.2730 },
  'emeryville': { latitude: 37.8395, longitude: -122.2892 },
  'alameda': { latitude: 37.7652, longitude: -122.2416 },
  'san jose': { latitude: 37.3382, longitude: -121.8863 },
  'santa clara': { latitude: 37.3541, longitude: -121.9552 },
  'sunnyvale': { latitude: 37.3688, longitude: -122.0363 },
  'mountain view': { latitude: 37.3861, longitude: -122.0839 },
  'palo alto': { latitude: 37.4419, longitude: -122.1430 },
  'menlo park': { latitude: 37.4530, longitude: -122.1817 },
  'redwood city': { latitude: 37.4852, longitude: -122.2364 },
  'san mateo': { latitude: 37.5630, longitude: -122.3255 },
  'fremont': { latitude: 37.5485, longitude: -121.9886 },
  'hayward': { latitude: 37.6688, longitude: -122.0808 },
  'pleasanton': { latitude: 37.6624, longitude: -121.8747 },
  'livermore': { latitude: 37.6819, longitude: -121.7680 },
  'concord': { latitude: 37.9780, longitude: -122.0311 },
  'walnut creek': { latitude: 37.9101, longitude: -122.0652 },
  'vallejo': { latitude: 38.1041, longitude: -122.2566 },
  'napa': { latitude: 38.2975, longitude: -122.2869 },
  'santa rosa': { latitude: 38.4404, longitude: -122.7141 },
  'sacramento': { latitude: 38.5816, longitude: -121.4944 },
  'stockton': { latitude: 37.9577, longitude: -121.2908 },
  'modesto': { latitude: 37.6391, longitude: -120.9969 },
  'tracy': { latitude: 37.7397, longitude: -121.4252 },
  'davis': { latitude: 38.5449, longitude: -121.7405 },
  'roseville': { latitude: 38.7521, longitude: -121.2880 },
  'rocklin': { latitude: 38.7907, longitude: -121.2358 },
  'redding': { latitude: 40.5865, longitude: -122.3917 },
  'chico': { latitude: 39.7285, longitude: -121.8375 },
  'remote': { latitude: 37.7749, longitude: -122.4194 },
  'california': { latitude: 37.7749, longitude: -122.4194 },
}

export function inferCoordinates(location: string | null | undefined): Coordinates | null {
  if (!location) return null

  const normalized = location.toLowerCase()

  for (const [key, coordinates] of Object.entries(knownLocationCoordinates)) {
    if (normalized.includes(key)) {
      return coordinates
    }
  }

  return null
}

export function projectToNorCalMap(latitude?: number | null, longitude?: number | null) {
  if (!latitude || !longitude) return null

  // Rough Northern California bounding box.
  const minLat = 36.8
  const maxLat = 40.9
  const minLng = -123.3
  const maxLng = -120.2

  const x = ((longitude - minLng) / (maxLng - minLng)) * 100
  const y = (1 - (latitude - minLat) / (maxLat - minLat)) * 100

  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(4, Math.min(96, y)),
  }
}
