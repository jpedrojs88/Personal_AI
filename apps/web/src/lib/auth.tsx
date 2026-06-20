import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api";
import type { AuthUser } from "../types";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "personal-ia-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setIsReady(true);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as { token: string; user: AuthUser };
        const me = await apiRequest<AuthUser>("/auth/me", {
          token: parsed.token,
        });

        setToken(parsed.token);
        setUser(me);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            token: parsed.token,
            user: me,
          }),
        );
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        queryClient.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    void restoreSession();
  }, [queryClient]);

  const persist = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser,
      }),
    );
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (payload: { email: string; password: string }) => {
    const data = await apiRequest<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    persist(data.accessToken, data.user);
  };

  const register = async (payload: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    const data = await apiRequest<{ accessToken: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    persist(data.accessToken, data.user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    queryClient.clear();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isReady,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
