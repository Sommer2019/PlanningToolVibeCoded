import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, getActiveUser, setActiveUser, MOCK_MODE } from "../api";
import type { Me, MockUser } from "../api";

interface AuthState {
  me: Me | null;
  loading: boolean;
  /** Dev/demo identities available to switch between (mock mode only). */
  mockUsers: MockUser[];
  /** Whether the dev identity switcher should be shown. */
  devSwitcher: boolean;
  activeUser: string;
  switchUser: (subject: string) => void;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [mockUsers, setMockUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUser] = useState(getActiveUser());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [identity, users] = await Promise.all([api.getMe(), api.getMockUsers()]);
      setMe(identity);
      setMockUsers(users);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const switchUser = useCallback(
    (subject: string) => {
      setActiveUser(subject);
      window.location.reload();
    },
    [],
  );

  // Show the switcher whenever identities are available (mock backend or demo).
  const devSwitcher = MOCK_MODE || mockUsers.length > 0;

  return (
    <AuthCtx.Provider value={{ me, loading, mockUsers, devSwitcher, activeUser, switchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
