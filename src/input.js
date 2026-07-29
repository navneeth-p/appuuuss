// Pure input-state logic — no three.js / DOM globals used at module scope so
// this stays importable under vitest (node env). The keyboard binding lives
// in `attach(target)` below and is the only DOM-touching part; callers that
// only need the d-pad / testable state can ignore it entirely.

const KEY_MAP = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'left',
  d: 'right',
  A: 'left',
  D: 'right',
};

/**
 * @returns {{
 *   state: {left:boolean, right:boolean},
 *   setKey:(key:string, down:boolean)=>void,
 *   press:(dir:'left'|'right')=>void,
 *   release:(dir:'left'|'right')=>void,
 *   axis:()=>number,
 *   setLocked:(locked:boolean)=>void,
 *   isLocked:()=>boolean,
 * }}
 */
export function createInputState() {
  const state = { left: false, right: false };
  let locked = false;

  function setKey(key, down) {
    const dir = KEY_MAP[key];
    if (!dir) return;
    state[dir] = down;
  }

  function press(dir) {
    if (dir === 'left' || dir === 'right') state[dir] = true;
  }

  function release(dir) {
    if (dir === 'left' || dir === 'right') state[dir] = false;
  }

  function axis() {
    if (locked) return 0;
    const raw = (state.right ? 1 : 0) - (state.left ? 1 : 0);
    return raw;
  }

  function setLocked(value) {
    locked = !!value;
  }

  function isLocked() {
    return locked;
  }

  return { state, setKey, press, release, axis, setLocked, isLocked };
}

/**
 * Wires keyboard events on `target` (typically `window`) to an input state
 * created by `createInputState()`. Kept separate so the pure state logic
 * above can be unit-tested without a DOM.
 * @param {ReturnType<typeof createInputState>} input
 * @param {EventTarget} target
 * @returns {() => void} detach function
 */
export function attach(input, target) {
  function onKeyDown(e) {
    input.setKey(e.key, true);
  }
  function onKeyUp(e) {
    input.setKey(e.key, false);
  }
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
  };
}
