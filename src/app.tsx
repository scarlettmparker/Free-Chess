import { MetaProvider, Title } from '@solidjs/meta';
import Game from './_components/game';

const App = () => {
  return (
    <MetaProvider>
      <Title>Free Chess</Title>
      <Game />
    </MetaProvider>
  );
};

export default App;
