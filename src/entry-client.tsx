import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import i18n from 'i18next';
import { Suspense } from 'react';

import { Router } from './router';
import Layout from './components/layout';
import { setI18n } from '@sun/i18n';
import { initClientBootstrap } from '@sun/ssr';
import { loadPersistedTheme } from '@sun/themes';
import './utils/configure-framework';
import '@sun/components/style.css';
import '@sun/themes/style.css';

loadPersistedTheme();

setI18n(i18n);

initClientBootstrap({ i18n })
  .then(() => {
    ReactDOM.hydrateRoot(
      document.getElementById('app') as HTMLElement,
      <BrowserRouter>
        <Layout>
          <Suspense fallback={null}>
            <Router />
          </Suspense>
        </Layout>
      </BrowserRouter>,
    );
  })
  .catch((error) => {
    console.error('Client bootstrap failed', error);
  });
