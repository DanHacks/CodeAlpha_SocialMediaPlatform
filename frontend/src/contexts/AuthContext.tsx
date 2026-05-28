import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { currentUser, User } from "@/lib/mockData";
import { api, isApiEnabled, setTokens } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "safeguardmeet.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    if (isApiEnabled()) {
      const res = await api.login(email, password);
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      persist({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        avatar: currentUser.avatar,
      });
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
    persist({ ...currentUser, email, name: email.split("@")[0].replace(/[._]/g, " ") || currentUser.name });
  };

  const register = async (name: string, email: string, password: string) => {
    if (isApiEnabled()) {
      await api.register(email, password, name);
      const res = await api.login(email, password);
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      persist({ id: res.user.id, name: res.user.name, email: res.user.email, avatar: currentUser.avatar });
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
    persist({ ...currentUser, name, email });
  };

  const logout = () => { setTokens(null); persist(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
