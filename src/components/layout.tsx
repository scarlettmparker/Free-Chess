import type { ReactNode } from 'react';
import Nav from '~/components/nav';

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
  return (
    <>
      <Nav />
      {children}
    </>
  );
};

export default Layout;
