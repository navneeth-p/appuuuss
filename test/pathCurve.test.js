import { describe, it, expect } from 'vitest';
import {
  getPathPoint,
  getPathTangent,
  progressForPosition,
  CONTROL_POINTS,
} from '../src/world/pathCurve.js';

describe('pathCurve', () => {
  it('getPathPoint returns a Vector3-like at t=0 matching the start control point', () => {
    const start = getPathPoint(0);
    expect(start).toHaveProperty('x');
    expect(start).toHaveProperty('y');
    expect(start).toHaveProperty('z');
    expect(start.x).toBeCloseTo(CONTROL_POINTS[0].x, 1);
    expect(start.z).toBeCloseTo(CONTROL_POINTS[0].z, 1);
  });

  it('getPathPoint at t=1 matches the end control point', () => {
    const end = getPathPoint(1);
    const last = CONTROL_POINTS[CONTROL_POINTS.length - 1];
    expect(end.x).toBeCloseTo(last.x, 0);
    expect(end.z).toBeCloseTo(last.z, 0);
  });

  it('getPathTangent returns a normalized direction vector', () => {
    const tangent = getPathTangent(0.5);
    const len = Math.sqrt(tangent.x ** 2 + tangent.y ** 2 + tangent.z ** 2);
    expect(len).toBeCloseTo(1, 2);
  });

  it('progressForPosition returns ~0 at the start and ~1 at the end', () => {
    const startPos = getPathPoint(0);
    const endPos = getPathPoint(1);
    expect(progressForPosition(startPos)).toBeCloseTo(0, 1);
    expect(progressForPosition(endPos)).toBeCloseTo(1, 1);
  });

  it('progressForPosition clamps to [0,1] for out-of-range positions', () => {
    const farAway = { x: 1000, y: 0, z: 1000 };
    const p = progressForPosition(farAway);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});
