import { describe, it, expect } from 'vitest';
import { getPhaseState, DAWN, MIDDAY, NIGHT } from '../src/world/phase.js';

describe('getPhaseState', () => {
  it('returns dawn palette at progress 0', () => {
    const state = getPhaseState(0);
    expect(state.skyTop.r).toBeCloseTo(DAWN.skyTop.r);
    expect(state.skyBottom.r).toBeCloseTo(DAWN.skyBottom.r);
    expect(state.fogDensity).toBeCloseTo(DAWN.fogDensity);
    expect(state.sunElevation).toBeCloseTo(DAWN.sunElevation);
    expect(state.petalMode).toBe('settle');
  });

  it('returns night palette at progress 1', () => {
    const state = getPhaseState(1);
    expect(state.skyTop.r).toBeCloseTo(NIGHT.skyTop.r);
    expect(state.skyBottom.r).toBeCloseTo(NIGHT.skyBottom.r);
    expect(state.fogDensity).toBeCloseTo(NIGHT.fogDensity);
    expect(state.sunElevation).toBeCloseTo(NIGHT.sunElevation);
    expect(state.petalMode).toBe('rise');
  });

  it('returns midday-ish values (between dawn and night) at progress 0.5', () => {
    const state = getPhaseState(0.5);
    expect(state.skyTop.r).toBeCloseTo(MIDDAY.skyTop.r);
    expect(state.sunElevation).toBeCloseTo(MIDDAY.sunElevation);
    expect(state.petalMode).toBe('gust');

    // sanity: midday sun elevation is higher than both dawn and night
    expect(state.sunElevation).toBeGreaterThan(DAWN.sunElevation);
    expect(state.sunElevation).toBeGreaterThan(NIGHT.sunElevation);
  });

  it('wind strength peaks near midday', () => {
    const dawn = getPhaseState(0);
    const midday = getPhaseState(0.5);
    const night = getPhaseState(1);
    expect(midday.windStrength).toBeGreaterThan(dawn.windStrength);
    expect(midday.windStrength).toBeGreaterThan(night.windStrength);
  });

  it('clamps progress outside 0..1', () => {
    expect(getPhaseState(-1)).toEqual(getPhaseState(0));
    expect(getPhaseState(2)).toEqual(getPhaseState(1));
  });
});
