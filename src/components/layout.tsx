import type { ReactNode } from 'react';

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
  return <>{children}</>;
};

export default Layout;
