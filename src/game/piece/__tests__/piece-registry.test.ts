import { describe, it, expect } from 'vitest';
import { PieceRegistry } from '~/game/piece/piece-registry';
import { BUILTIN_DEFINITIONS } from '~/game/piece/builtins';

describe('PieceRegistry', () => {
  it('registers builtins with historical ids', () => {
    const registry = new PieceRegistry();
    for (const def of BUILTIN_DEFINITIONS) {
      registry.register(def, def.id === 1 ? 10 : undefined);
    }
    // Just ensure registration works and lookup returns something
    expect(registry.list().length).toBe(BUILTIN_DEFINITIONS.length);
  });

  it('returns existing base id on duplicate registration', () => {
    const registry = new PieceRegistry();
    const def = BUILTIN_DEFINITIONS[0];
    const first = registry.register(def, 10);
    const second = registry.register(def, 20);
    expect(second).toBe(first);
  });

  it('resolves engine ids by colour', () => {
    const registry = new PieceRegistry();
    const def = BUILTIN_DEFINITIONS[0];
    registry.register(def, 10);
    expect(registry.getEngineId(def.id, 0)).toBe(10);
    expect(registry.getEngineId(def.id, 1)).toBe(11);
  });
});
