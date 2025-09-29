import { MetaProvider, Title } from '@solidjs/meta';
import Game from './_components/game';
import { createSignal } from 'solid-js';
import { PlayerColor, colors, gameState } from './game/consts/board';

const App = () => {
  const [side, setSide] = createSignal<PlayerColor>(gameState.side);

  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <div class="flex items-center justify-center flex-col gap-4 w-full max-w-[1200px] flex-wrap absolute left-1/2 transform -translate-x-1/2 my-16">
        <span class="text-white">{side() == colors.WHITE ? 'White' : 'Black'} to move</span>
        <Game setSide={setSide} />
      </div>
    </MetaProvider>
  );
};

export default App;
