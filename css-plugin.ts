import { plugin } from 'bun';

plugin({
  name: 'css-stub',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async () => ({
      contents: 'export default {};',
      loader: 'js',
    }));
  },
});
