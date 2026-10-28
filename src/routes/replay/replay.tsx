import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import ReplayGamePage from '~/components/chess/replay-game-page';

/**
 * Stored game replay route.
 */
const Replay = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <Suspense fallback={null}>
      <ReplayGamePage gameId={id} />
    </Suspense>
  );
};

export default Replay;
