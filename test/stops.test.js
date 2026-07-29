import { describe, it, expect } from 'vitest';
import { distributeStops, createStopChecker } from '../src/characters/stops.js';

describe('distributeStops', () => {
  it('spreads N stops evenly across pathT using (i+0.5)/N', () => {
    const stops = distributeStops([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(stops).toHaveLength(3);
    expect(stops[0].t).toBeCloseTo(0.5 / 3);
    expect(stops[1].t).toBeCloseTo(1.5 / 3);
    expect(stops[2].t).toBeCloseTo(2.5 / 3);
  });
});

describe('createStopChecker', () => {
  const stops = [
    { id: 'x', t: 0.1 },
    { id: 'y', t: 0.5 },
    { id: 'z', t: 0.9 },
  ];

  it('returns the stop id on first entry into trigger radius', () => {
    const checkStop = createStopChecker(stops, { radius: 0.04 });
    expect(checkStop(0.1)).toBe('x');
    // still inside radius on the next call -> hysteresis, no re-fire
    expect(checkStop(0.12)).toBeNull();
  });

  it('returns null when not within radius of any stop', () => {
    const checkStop = createStopChecker(stops, { radius: 0.04 });
    expect(checkStop(0.3)).toBeNull();
  });

  it('does not re-trigger the same stop while still inside the radius', () => {
    const checkStop = createStopChecker(stops, { radius: 0.04 });
    expect(checkStop(0.5)).toBe('y');
    // still inside radius on subsequent calls -> no re-fire
    expect(checkStop(0.51)).toBeNull();
    expect(checkStop(0.49)).toBeNull();
  });

  it('re-triggers after leaving (radius + margin) and returning', () => {
    const checkStop = createStopChecker(stops, { radius: 0.04, margin: 0.02 });
    expect(checkStop(0.5)).toBe('y');
    expect(checkStop(0.51)).toBeNull(); // still inside, no refire
    // leave beyond radius+margin
    expect(checkStop(0.5 + 0.04 + 0.02 + 0.001)).toBeNull();
    // return within radius -> refires
    expect(checkStop(0.5)).toBe('y');
  });

  it('tracks hysteresis independently per stop', () => {
    const checkStop = createStopChecker(stops, { radius: 0.04 });
    expect(checkStop(0.1)).toBe('x');
    expect(checkStop(0.1)).toBeNull();
    // move to a different stop's radius, should fire fresh
    expect(checkStop(0.9)).toBe('z');
  });
});
