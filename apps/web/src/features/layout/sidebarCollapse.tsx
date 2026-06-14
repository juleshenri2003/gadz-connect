import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "gadz-connect:sidebar-collapsed";

interface SidebarCollapseContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarCollapseContext =
  createContext<SidebarCollapseContextValue | null>(null);

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore quota / private mode
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapseContext)?.collapsed ?? false;
}

export function useSidebarCollapseToggle(): (() => void) | undefined {
  return useContext(SidebarCollapseContext)?.toggle;
}
