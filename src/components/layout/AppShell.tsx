import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Application shell: persistent navigation, top bar and routed content area.
 * Below `lg` the sidebar collapses into a drawer.
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => setNavOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <MobileSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
