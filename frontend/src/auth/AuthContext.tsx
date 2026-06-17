import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidc } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { api, getActiveUser, setActiveUser, MOCK_MODE } from "../api";
import { setBearerToken } from "../api/session";
import type { Me, MockUser } from "../api";

interface AuthState {
  me: Me | null;
  loading: boolean;
  mockUsers: MockUser[];
  devSwitcher: boolean;
  activeUser: string;
  switchUser: (subject: string) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "https://hackathon.amogusdrip.de/auth/application/o/vibecode/",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "oIgnzizlgBgGKtC1SJBvM6HqEtasIMXxkTsIN8O9",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

function MockAuthProvider({ children }: { children: ReactNode }) {
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

  const switchUser = useCallback((subject: string) => {
    setActiveUser(subject);
    window.location.reload();
  }, []);

  return (
    <AuthCtx.Provider value={{ me, loading, mockUsers, devSwitcher: true, activeUser, switchUser, logout: () => {} }}>
      {children}
    </AuthCtx.Provider>
  );
}

function RealAuthProvider({ children }: { children: ReactNode }) {
  const oidc = useOidc();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (oidc.isLoading) return;

    if (!oidc.isAuthenticated) {
      void oidc.signinRedirect();
      return;
    }

    setBearerToken(oidc.user?.access_token || null);

    api.getMe().then(identity => {
      setMe(identity);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load user from API", err);
      setLoading(false);
    });
  }, [oidc.isLoading, oidc.isAuthenticated, oidc.user?.access_token]);

  if (oidc.isLoading || (!oidc.isAuthenticated && !oidc.error) || loading) {
    return <div style={{ padding: "2rem" }}>Loading App...</div>;
  }

  if (oidc.error) {
    return <div style={{ padding: "2rem", color: "red" }}>Auth Error: {oidc.error.message}</div>;
  }

  return (
    <AuthCtx.Provider value={{ 
      me, 
      loading: false, 
      mockUsers: [], 
      devSwitcher: false, 
      activeUser: "", 
      switchUser: () => {}, 
      logout: () => oidc.removeUser()
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (MOCK_MODE) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <OidcProvider {...oidcConfig}>
      <RealAuthProvider>{children}</RealAuthProvider>
    </OidcProvider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
