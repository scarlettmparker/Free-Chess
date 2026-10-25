import { useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getBackgroundHex } from '@sun/utils';
import { ThemeSwitcher, THEME_APPLIED_EVENT, type ThemeOption } from '@sun/themes';
import Nav from '~/components/nav';
import styles from './layout.module.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type LayoutProps = {
  /**
   * Page content.
   */
  children: ReactNode;
};

/**
 * Public shell. The chess page supplies its own heading and status.
 */
const Layout = (props: LayoutProps) => {
  const { children } = props;
  // Computed after mount (not during render) so the SSR HTML and the client's
  // first render match; getBackgroundHex depends on the wall clock.
  const [backgroundColour, setBackgroundColour] = useState<string | undefined>(undefined);
  const [themes, setThemes] = useState<ThemeOption[]>([]);

  useIsomorphicLayoutEffect(() => {
    const update = () => setBackgroundColour(getBackgroundHex());
    update();
    const interval = setInterval(update, 5000);
    window.addEventListener(THEME_APPLIED_EVENT, update);
    return () => {
      clearInterval(interval);
      window.removeEventListener(THEME_APPLIED_EVENT, update);
    };
  }, []);

  useEffect(() => {
    setThemes(window.__themes__ ?? []);
  }, []);

  return (
    <main className={styles.main} style={{ backgroundColor: backgroundColour }}>
      <Nav />
      {children}
      <div className={styles.switcher}>
        <ThemeSwitcher themes={themes} />
      </div>
    </main>
  );
};

export default Layout;
