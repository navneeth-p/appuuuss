// Uses three's core math (Vector3, CatmullRomCurve3) only — no WebGPU/DOM
// dependent modules — so this stays importable under vitest (node env).
import { Vector3, CatmullRomCurve3 } from 'three';

// Fixed control points describing the winding garden path. Edit these to
// reshape the journey; the ground/foliage/characters all derive from this
// single curve. Units are arbitrary world units (meters-ish).
export const CONTROL_POINTS = [
  new Vector3(0, 0, 0),
  new Vector3(4, 0, -6),
  new Vector3(-3, 0, -14),
  new Vector3(2, 0, -24),
  new Vector3(10, 0, -30),
  new Vector3(6, 0, -40),
  new Vector3(0, 0, -48),
];

export const pathCurve = new CatmullRomCurve3(CONTROL_POINTS, false, 'catmullrom', 0.5);

const SAMPLE_COUNT = 200;
const sampledPoints = pathCurve.getSpacedPoints(SAMPLE_COUNT);

/**
 * @param {number} t 0..1 clamped progress along the path.
 * @returns {Vector3} world position at t.
 */
export function getPathPoint(t) {
  const clamped = Math.min(1, Math.max(0, t));
  return pathCurve.getPointAt(clamped);
}

/**
 * @param {number} t 0..1 clamped progress along the path.
 * @returns {Vector3} normalized tangent (forward direction) at t.
 */
export function getPathTangent(t) {
  const clamped = Math.min(1, Math.max(0, t));
  return pathCurve.getTangentAt(clamped);
}

/**
 * Nearest-point search over a sampled curve. Returns the path progress
 * (0..1, clamped) whose curve point is closest to `pos`.
 * @param {{x:number,y:number,z:number}} pos
 * @returns {number} progress 0..1
 */
export function progressForPosition(pos) {
  let bestIndex = 0;
  let bestDistSq = Infinity;

  for (let i = 0; i < sampledPoints.length; i++) {
    const p = sampledPoints[i];
    const dx = p.x - pos.x;
    const dy = p.y - pos.y;
    const dz = p.z - pos.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
    }
  }

  return bestIndex / (sampledPoints.length - 1);
}
