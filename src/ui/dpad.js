// On-screen left/right d-pad, injected into #ui-root. Wired to input's
// press/release so it drives the same axis() as the keyboard. Always
// present in the DOM; CSS keeps it visible on touch/small screens and
// unobtrusive (but usable) on desktop.

const STYLE_ID = 'dpad-styles';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #dpad {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      display: flex;
      gap: 18px;
      z-index: 20;
    }
    #dpad button {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35);
      background: rgba(20, 30, 25, 0.45);
      color: #f4e9d8;
      font-size: 26px;
      line-height: 1;
      display: grid;
      place-items: center;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      user-select: none;
    }
    #dpad button:active {
      background: rgba(224, 122, 95, 0.55);
    }
    @media (min-width: 900px) and (pointer: fine) {
      #dpad { opacity: 0.55; }
      #dpad:hover { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * @param {ReturnType<typeof import('../input.js').createInputState>} input
 * @param {HTMLElement} [root] defaults to #ui-root
 * @returns {{ el: HTMLElement }}
 */
export function createDpad(input, root = document.getElementById('ui-root')) {
  ensureStyles();

  const el = document.createElement('div');
  el.id = 'dpad';

  const left = document.createElement('button');
  left.type = 'button';
  left.setAttribute('aria-label', 'Walk left');
  left.textContent = '←';

  const right = document.createElement('button');
  right.type = 'button';
  right.setAttribute('aria-label', 'Walk right');
  right.textContent = '→';

  function bind(button, dir) {
    const down = (e) => {
      e.preventDefault();
      input.press(dir);
    };
    const up = (e) => {
      e.preventDefault();
      input.release(dir);
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointerleave', up);
    button.addEventListener('pointercancel', up);
  }

  bind(left, 'left');
  bind(right, 'right');

  el.appendChild(left);
  el.appendChild(right);
  root?.appendChild(el);

  return { el };
}
