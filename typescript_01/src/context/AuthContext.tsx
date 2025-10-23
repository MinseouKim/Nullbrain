import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type AuthUser = { id: string; role?: string };

interface AuthContextProps {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

const LS_KEY = "nb_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // 앱 시작 시 localStorage에서 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  };

  const isLoggedIn = !!user;
  const value = useMemo(
    () => ({ user, isLoggedIn, login, logout }),
    [user, isLoggedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
