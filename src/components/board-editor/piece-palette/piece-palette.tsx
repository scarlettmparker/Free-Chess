import { Button } from '@sun/components';
import { partUrl } from '~/components/chess/piece';
import type { MedusaPieceDefinitionDto } from '~/utils/piece-types';
import styles from './piece-palette.module.css';

/**
 * Palette tool, a piece with a colour.
 */
export type PaletteSelection = {
  /**
   * Selected definition id.
   */
  definitionId: string;
  /**
   * Selected colour.
   */
  color: 0 | 1;
};

type PiecePaletteProps = {
  /**
   * Placeable definitions.
   */
  definitions: MedusaPieceDefinitionDto[];
  /**
   * Row colour.
   */
  color: 0 | 1;
  /**
   * Active tool.
   */
  selection: PaletteSelection;
  /**
   * Selects a tool.
   *
   * @param selection Tool to activate.
   */
  onSelect: (selection: PaletteSelection) => void;
};

/**
 * One horizontal piece carousel row.
 */
const PiecePalette = (props: PiecePaletteProps) => {
  const { definitions, color, selection, onSelect } = props;

  return (
    <div className={styles.carousel}>
      {definitions.map((definition) => {
        if (!definition.sprite) return null;
        const active = selection.definitionId === definition.id && selection.color === color;
        return (
          <Button
            key={definition.id}
            type="button"
            variant={active ? 'default' : 'secondary'}
            size="icon"
            className={styles.swatch}
            title={definition.name}
            aria-label={definition.name}
            aria-pressed={active}
            onClick={() => onSelect({ definitionId: definition.id, color })}
          >
            <span className={styles.sprite} aria-hidden="true">
              <img src={partUrl(definition.sprite.headKey, color)} alt="" draggable={false} />
              <img src={partUrl(definition.sprite.bodyKey, color)} alt="" draggable={false} />
              <img src={partUrl(definition.sprite.footKey, color)} alt="" draggable={false} />
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default PiecePalette;
