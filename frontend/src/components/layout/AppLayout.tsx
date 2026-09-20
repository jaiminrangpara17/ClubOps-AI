import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Application shell: persistent navigation rail, topbar and routed content.
 * Below `lg` the rail collapses into a drawer.
 */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Any route change closes the drawer.
  useEffect(() => setNavOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only left-4 z-50 rounded-control bg-brand px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:top-3"
      >
        Skip to content
      </a>

      <Sidebar />
      <MobileSidebar open={navOpen} onClose={closeNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
