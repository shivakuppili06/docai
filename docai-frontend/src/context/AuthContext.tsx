import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading?: boolean;
  setSession: (data: { token: string; email: string; fullName: string; id?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const email = localStorage.getItem("docai_email");
    const fullName = localStorage.getItem("docai_fullName");
    return email ? { id: "", email, fullName: fullName || "" } : null;
  });

  // Store session data after a successful login/register API call.
  // Does NOT make any API call — the page handles that.
  const setSession = (data: { token: string; email: string; fullName: string; id?: string }) => {
    localStorage.setItem("docai_token", data.token);
    localStorage.setItem("docai_email", data.email);
    localStorage.setItem("docai_fullName", data.fullName || "");
    setUser({ id: data.id || "", email: data.email, fullName: data.fullName });
  };

  const logout = () => {
    localStorage.removeItem("docai_token");
    localStorage.removeItem("docai_email");
    localStorage.removeItem("docai_fullName");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
