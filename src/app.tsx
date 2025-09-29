import { MetaProvider, Title } from '@solidjs/meta';
import Game from './_components/game';
import { colors, gameState } from './game/consts/board';

const App = () => {
  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <div class="flex items-center justify-center flex-col gap-4 w-full max-w-[1200px] flex-wrap absolute left-1/2 transform -translate-x-1/2 my-16">
        <span class="text-white">{gameState.side == colors.WHITE ? 'White' : 'Black'} to move</span>
        <Game />
      </div>
    </MetaProvider>
  );
};

export default App;
