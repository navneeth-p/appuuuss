// Pure logic, no three.js / DOM imports — must stay importable under vitest (node env).
// Interpolates the whole day-cycle (sky, fog, sun, wind, petals) from a single
// `progress` value (0 = dawn/start of journey, 1 = night/end of journey).

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(a, b, t) {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

export const DAWN = {
  skyTop: { r: 0.20, g: 0.28, b: 0.45 },
  skyBottom: { r: 0.95, g: 0.70, b: 0.55 },
  fogColor: { r: 0.85, g: 0.72, b: 0.68 },
  fogDensity: 0.018,
  sunColor: { r: 1.0, g: 0.85, b: 0.65 },
  sunElevation: 8,
  bloomStrength: 0.35,
  windStrength: 0.15,
  flowerDensity: 0.6,
};

export const MIDDAY = {
  skyTop: { r: 0.30, g: 0.55, b: 0.90 },
  skyBottom: { r: 0.75, g: 0.88, b: 0.98 },
  fogColor: { r: 0.80, g: 0.87, b: 0.92 },
  fogDensity: 0.008,
  sunColor: { r: 1.0, g: 0.98, b: 0.92 },
  sunElevation: 70,
  bloomStrength: 0.55,
  windStrength: 0.6,
  flowerDensity: 1.0,
};

export const NIGHT = {
  skyTop: { r: 0.02, g: 0.03, b: 0.09 },
  skyBottom: { r: 0.08, g: 0.10, b: 0.22 },
  fogColor: { r: 0.03, g: 0.05, b: 0.10 },
  fogDensity: 0.022,
  sunColor: { r: 0.55, g: 0.60, b: 0.85 },
  sunElevation: -5,
  bloomStrength: 0.8,
  windStrength: 0.25,
  flowerDensity: 0.4,
};

function petalModeFor(progress) {
  if (progress < 0.35) return 'settle';
  if (progress < 0.75) return 'gust';
  return 'rise';
}

/**
 * @param {number} progress 0..1 (clamped) journey progress along the path.
 * @returns {object} interpolated phase state.
 */
export function getPhaseState(progress) {
  const p = Math.min(1, Math.max(0, progress));

  const [from, to, localT] = p <= 0.5
    ? [DAWN, MIDDAY, p / 0.5]
    : [MIDDAY, NIGHT, (p - 0.5) / 0.5];

  return {
    progress: p,
    skyTop: lerpColor(from.skyTop, to.skyTop, localT),
    skyBottom: lerpColor(from.skyBottom, to.skyBottom, localT),
    fogColor: lerpColor(from.fogColor, to.fogColor, localT),
    fogDensity: lerp(from.fogDensity, to.fogDensity, localT),
    sunColor: lerpColor(from.sunColor, to.sunColor, localT),
    sunElevation: lerp(from.sunElevation, to.sunElevation, localT),
    bloomStrength: lerp(from.bloomStrength, to.bloomStrength, localT),
    windStrength: lerp(from.windStrength, to.windStrength, localT),
    flowerDensity: lerp(from.flowerDensity, to.flowerDensity, localT),
    petalMode: petalModeFor(p),
  };
}
