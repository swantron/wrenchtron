import { describe, it, expect } from 'vitest';
import { covered } from '../difftronDemo';

describe('difftronDemo', () => {
  it('covers covered()', () => {
    expect(covered(2, 3)).toBe(5);
  });
});
