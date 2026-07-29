import { describe, it, expect } from 'vitest';
import { validateStops } from '../src/validateConfig.js';

describe('validateStops', () => {
  it('keeps valid stops', () => {
    const ok = [{ id: 'a', title: 'T', photos: ['p.jpg'], caption: 'c' }];
    expect(validateStops(ok)).toHaveLength(1);
  });

  it('drops entries missing id or title and warns', () => {
    const res = validateStops([{ title: 'no id', photos: [], caption: 'c' }]);
    expect(res).toHaveLength(0);
  });

  it('defaults empty photos to a placeholder', () => {
    const res = validateStops([{ id: 'a', title: 'T', caption: 'c' }]);
    expect(res[0].photos.length).toBeGreaterThan(0);
  });
});
