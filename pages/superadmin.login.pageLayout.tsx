// Super admin login uses a simple layout with no header/footer
// since it's a standalone administrative portal

import React from 'react';

const SimpleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default [SimpleLayout];
