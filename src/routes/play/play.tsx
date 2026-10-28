import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import PlayGamePage from '~/components/chess/play-game-page';

/**
 * Live game route.
 */
const Play = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <Suspense fallback={null}>
      <PlayGamePage gameId={id} />
    </Suspense>
  );
};

export default Play;
