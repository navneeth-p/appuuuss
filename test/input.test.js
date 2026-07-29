import { describe, it, expect, beforeEach } from 'vitest';
import { createInputState } from '../src/input.js';

describe('input state', () => {
  let input;
  beforeEach(() => {
    input = createInputState();
  });

  it('setKey toggles state.left/right', () => {
    input.setKey('ArrowLeft', true);
    expect(input.state.left).toBe(true);
    input.setKey('ArrowLeft', false);
    expect(input.state.left).toBe(false);
  });

  it('setKey recognizes a/d as left/right', () => {
    input.setKey('a', true);
    expect(input.state.left).toBe(true);
    input.setKey('d', true);
    expect(input.state.right).toBe(true);
  });

  it('press/release toggle state (d-pad)', () => {
    input.press('right');
    expect(input.state.right).toBe(true);
    input.release('right');
    expect(input.state.right).toBe(false);
  });

  it('axis() returns -1 when only left held', () => {
    input.press('left');
    expect(input.axis()).toBe(-1);
  });

  it('axis() returns 1 when only right held', () => {
    input.press('right');
    expect(input.axis()).toBe(1);
  });

  it('axis() returns 0 when both or neither held', () => {
    expect(input.axis()).toBe(0);
    input.press('left');
    input.press('right');
    expect(input.axis()).toBe(0);
  });

  it('axis() returns 0 when locked, even if a direction is held', () => {
    input.press('right');
    input.setLocked(true);
    expect(input.axis()).toBe(0);
    input.setLocked(false);
    expect(input.axis()).toBe(1);
  });
});
