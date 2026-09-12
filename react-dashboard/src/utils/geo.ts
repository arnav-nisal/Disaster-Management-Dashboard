// src/utils/geo.ts — Reverse Geocoding Utility with In-Memory Cache & Rate Limiting

interface GeoResult {
  city: string;
  state: string;
}

// In-memory cache keyed by rounded "lat,lon" string
const geoCache = new Map<string, GeoResult>();

// Rate limiter: enforce min 1100ms between Nominatim requests (TOS: 1 req/sec)
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

// Queue to serialize requests
let requestQueue: Promise<void> = Promise.resolve();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Reverse geocode a lat/lon pair using the free Nominatim OpenStreetMap API.
 * Results are cached in-memory to avoid redundant calls.
 * Rate-limited to 1 request per second per Nominatim TOS.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const key = cacheKey(lat, lon);

  // Return cached result immediately
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  // Serialize requests through a queue to enforce rate limiting
  const result = new Promise<GeoResult>((resolve) => {
    requestQueue = requestQueue.then(async () => {
      // Double-check cache (another queued request may have resolved this)
      if (geoCache.has(key)) {
        resolve(geoCache.get(key)!);
        return;
      }

      try {
        await waitForRateLimit();

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'DisasterManagementDashboard/2.4 (kurukshetra-hackathon)',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim returned ${response.status}`);
        }

        const data = await response.json();
        const address = data.address || {};

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          address.suburb ||
          address.hamlet ||
          'Unknown';

        const state =
          address.state ||
          address.state_district ||
          address.region ||
          'Unknown';

        const geoResult: GeoResult = { city, state };
        geoCache.set(key, geoResult);
        resolve(geoResult);
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
        const fallback: GeoResult = { city: 'Unknown', state: 'Unknown' };
        geoCache.set(key, fallback);
        resolve(fallback);
      }
    });
  });

  return result;
}

// ── React Hook ──

import { useState, useEffect } from 'react';

interface UseReverseGeocodeResult {
  city: string;
  state: string;
  loading: boolean;
}

/**
 * React hook for reverse geocoding. Automatically caches results.
 * Returns { city, state, loading }.
 */
export function useReverseGeocode(
  lat: number | undefined,
  lon: number | undefined
): UseReverseGeocodeResult {
  const [result, setResult] = useState<UseReverseGeocodeResult>({
    city: '',
    state: '',
    loading: true,
  });

  useEffect(() => {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      setResult({ city: 'Unknown', state: 'Unknown', loading: false });
      return;
    }

    // Check cache synchronously first
    const key = cacheKey(lat, lon);
    if (geoCache.has(key)) {
      const cached = geoCache.get(key)!;
      setResult({ city: cached.city, state: cached.state, loading: false });
      return;
    }

    let cancelled = false;
    setResult((prev) => ({ ...prev, loading: true }));

    reverseGeocode(lat, lon).then((geo) => {
      if (!cancelled) {
        setResult({ city: geo.city, state: geo.state, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return result;
}
