import { describe, expect, it } from 'vitest';
import { isLayoutDebugEnabled } from './LayoutDebug';

describe('isLayoutDebugEnabled', () => {
  it('is off by default', () => {
    expect(isLayoutDebugEnabled('')).toBe(false);
  });

  it('turns on with ?debug=layout', () => {
    expect(isLayoutDebugEnabled('?debug=layout')).toBe(true);
  });

  it('works next to other parameters and other debug views', () => {
    expect(isLayoutDebugEnabled('?seed=7&debug=fps&debug=layout')).toBe(true);
  });

  it('ignores other debug views', () => {
    expect(isLayoutDebugEnabled('?debug=fps')).toBe(false);
  });
});
