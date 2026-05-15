export type GeoResult = {
  latitude: number
  longitude: number
  confidence: 'office' | 'city' | 'region' | 'remote'
  queryUsed: string
}

const officeLocations: Record<string, { latitude: number; longitude: number }> = {
  'scale ai san francisco': { latitude: 37.7897, longitude: -122.3969 },
  'astranis san francisco': { latitude: 37.7507, longitude: -122.3871 },
  'openai san francisco': { latitude: 37.7936, longitude: -122.3965 },
}

const cityLocations: Record<string, { latitude: number; longitude: number }> = {
  'san francisco': { latitude: 37.7749, longitude: -122.4194 },
  'oakland': { latitude: 37.8044, longitude: -122.2712 },
  'berkeley': { latitude: 37.8715, longitude: -122.2730 },
  'alameda': { latitude: 37.7652, longitude: -122.2416 },
  'san jose': { latitude: 37.3382, longitude: -121.8863 },
  'santa clara': { latitude: 37.3541, longitude: -121.9552 },
  'mountain view': { latitude: 37.3861, longitude: -122.0839 },
  'palo alto': { latitude: 37.4419, longitude: -122.1430 },
  'fremont': { latitude: 37.5485, longitude: -121.9886 },
  'sacramento': { latitude: 38.5816, longitude: -121.4944 },
  'napa': { latitude: 38.2975, longitude: -122.2869 },
  'santa rosa': { latitude: 38.4404, longitude: -122.7141 },
}

export function geocodeJob(company: string, location: string): GeoResult | null {
  const companyText = (company || '').toLowerCase()
  const locationText = (location || '').toLowerCase()

  for (const [key, coords] of Object.entries(officeLocations)) {
    if (`${companyText} ${locationText}`.includes(key)) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        confidence: 'office',
        queryUsed: key,
      }
    }
  }

  for (const [key, coords] of Object.entries(cityLocations)) {
    if (locationText.includes(key)) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        confidence: 'city',
        queryUsed: key,
      }
    }
  }

  if (locationText.includes('remote')) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      confidence: 'remote',
      queryUsed: 'remote',
    }
  }

  if (locationText.includes('california') || locationText.includes('ca')) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      confidence: 'region',
      queryUsed: 'california',
    }
  }

  return null
}
