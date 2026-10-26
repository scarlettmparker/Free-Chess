import type { PieceDefinition } from './piece-definition';

/**
 * Sort move states by stored index before lookup.
 *
 * @param definition Definition to normalize.
 * @returns The original definition, or a sorted copy.
 */
function normalizeDefinition(definition: PieceDefinition): PieceDefinition {
  const states = definition.moveStates;
  if (!Array.isArray(states) || states.length < 2) return definition;
  const ordered = [...states].sort((a, b) => a.index - b.index);
  if (ordered.every((state, index) => state === states[index])) return definition;
  return { ...definition, moveStates: ordered };
}

/**
 * Maps piece definitions to dense engine ids and back.
 *
 * Built-in definitions register with their historical ids so that FEN and
 * serialized games keep working. Database-loaded definitions receive fresh
 * ids allocated in ascending order.
 */
export class PieceRegistry {
  private readonly definitions = new Map<number, PieceDefinition>();
  private readonly engineBaseIdByDefinition = new Map<number, number>();
  private readonly definitionIdByEngineBaseId = new Map<number, number>();
  private nextBaseId = 0;

  /**
   * Register a definition. An explicit engine base id (white id) is used
   * when supplied; otherwise the next free id is allocated.
   *
   * @returns The engine base id assigned to the definition.
   */
  register(definition: PieceDefinition, engineBaseId?: number): number {
    const existing = this.engineBaseIdByDefinition.get(definition.id);
    if (existing !== undefined) {
      return existing;
    }

    const baseId = engineBaseId !== undefined ? engineBaseId : this.allocateBaseId();

    this.definitions.set(definition.id, normalizeDefinition(definition));
    this.engineBaseIdByDefinition.set(definition.id, baseId);
    this.definitionIdByEngineBaseId.set(baseId, definition.id);

    if (engineBaseId !== undefined) {
      this.nextBaseId = Math.max(this.nextBaseId, engineBaseId + 2);
    }

    return baseId;
  }

  /**
   * Store a definition, overwriting any existing entry while keeping its
   * allocated engine base id stable.
   *
   * @param definition Definition to store.
   * @returns The engine base id assigned to the definition.
   */
  update(definition: PieceDefinition): number {
    const existing = this.engineBaseIdByDefinition.get(definition.id);
    if (existing === undefined) {
      return this.register(definition);
    }
    this.definitions.set(definition.id, normalizeDefinition(definition));
    return existing;
  }

  /**
   * Register several definitions at once.
   */
  registerAll(entries: Array<{ definition: PieceDefinition; engineBaseId?: number }>): void {
    for (const entry of entries) {
      this.register(entry.definition, entry.engineBaseId);
    }
  }

  /**
   * Look up a definition by its id.
   */
  getDefinition(definitionId: number): PieceDefinition | undefined {
    return this.definitions.get(definitionId);
  }

  /**
   * Engine base id (white id) for a definition.
   */
  getEngineBaseId(definitionId: number): number | undefined {
    return this.engineBaseIdByDefinition.get(definitionId);
  }

  /**
   * Definition id for an engine base id.
   */
  getDefinitionId(engineBaseId: number): number | undefined {
    return this.definitionIdByEngineBaseId.get(engineBaseId);
  }

  /**
   * Engine id for a definition and colour (even = white, odd = black).
   */
  getEngineId(definitionId: number, color: number): number | undefined {
    const base = this.engineBaseIdByDefinition.get(definitionId);
    return base === undefined ? undefined : base + color;
  }

  /**
   * All registered definitions.
   */
  list(): PieceDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Allocate the next free engine base id.
   */
  private allocateBaseId(): number {
    const base = this.nextBaseId;
    this.nextBaseId += 2;
    return base;
  }
}

/**
 * Shared registry instance used throughout the app.
 */
export const pieceRegistry = new PieceRegistry();
