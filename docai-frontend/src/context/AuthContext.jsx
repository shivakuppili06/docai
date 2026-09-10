import { createContext, useContext, useState } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("docai_email");
    return email ? { email } : null;
  });

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("docai_token", data.token);
    localStorage.setItem("docai_email", data.email);
    setUser({ email: data.email, fullName: data.fullName });
  };

  const register = async (email, password, fullName) => {
    const { data } = await authApi.register({ email, password, fullName });
    localStorage.setItem("docai_token", data.token);
    localStorage.setItem("docai_email", data.email);
    setUser({ email: data.email, fullName: data.fullName });
  };

  const logout = () => {
    localStorage.removeItem("docai_token");
    localStorage.removeItem("docai_email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
