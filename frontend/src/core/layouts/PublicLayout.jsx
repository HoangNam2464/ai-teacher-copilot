import React from 'react';
import { Outlet } from 'react-router-dom';
import { LandingHeader } from '../../features/landing/components/LandingHeader';
import { LandingFooter } from '../../features/landing/components/LandingFooter';

/**
 * PublicLayout — Marketing Layout Shell (Group B - Marketing Screen)
 * Provides sticky glassmorphism header, main canvas, and rich footer.
 */
export function PublicLayout() {
  return (
    <div className="public-layout-wrapper">
      <LandingHeader />
      <main className="public-layout-main">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
}
