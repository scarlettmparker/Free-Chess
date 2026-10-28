import { configurePageData } from '@sun/ssr';

configurePageData({
  perPatternTtl: {
    '/currentUser': 60_000,
  },
});
