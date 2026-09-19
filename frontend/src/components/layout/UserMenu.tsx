import { ChevronDown, LogOut, Palette, Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownSection,
  DropdownSeparator,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getUserRoleLabel } from "@/lib/auth";
import { cn } from "@/lib/cn";

/** Account menu: shows the authenticated user and handles sign-out. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const roleLabel = getUserRoleLabel(user.role);

  const handleSignOut = async (close: () => void) => {
    if (signingOut) return;
    setSigningOut(true);
    close();
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <Dropdown
      panelWidth="w-64"
      label="Account"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
          className={cn(
            "flex items-center gap-2 rounded-control py-1 pr-1.5 pl-1 transition-colors hover:bg-surface-inset",
            open && "bg-surface-inset",
          )}
        >
          <Avatar name={user.name} size="sm" />
          <span className="hidden flex-col text-left leading-tight md:flex">
            <span className="text-xs font-semibold text-fg">{user.name}</span>
            <span className="text-[11px] text-fg-subtle">{roleLabel}</span>
          </span>
          <ChevronDown width={14} height={14} aria-hidden className="text-fg-subtle" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="flex items-center gap-2.5 px-3 py-3">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
              <p className="truncate text-xs text-fg-subtle">{user.email}</p>
              <p className="mt-0.5 text-xs font-medium text-brand">{roleLabel}</p>
            </div>
          </div>
          <DropdownSeparator />
          <DropdownSection>
            <DropdownItem
              icon={Settings}
              onClick={() => {
                navigate("/settings");
                close();
              }}
            >
              Workspace settings
            </DropdownItem>
            <DropdownItem
              icon={Palette}
              onClick={() => {
                navigate("/foundation");
                close();
              }}
            >
              Design foundation
            </DropdownItem>
          </DropdownSection>
          <DropdownSeparator />
          <DropdownSection>
            <DropdownItem icon={LogOut} disabled={signingOut} onClick={() => void handleSignOut(close)}>
              {signingOut ? "Signing out…" : "Sign out"}
            </DropdownItem>
          </DropdownSection>
        </>
      )}
    </Dropdown>
  );
}
