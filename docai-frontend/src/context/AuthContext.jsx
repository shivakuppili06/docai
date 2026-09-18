import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("docai_email");
    const fullName = localStorage.getItem("docai_fullName");
    return email ? { email, fullName } : null;
  });

  // Store session data after a successful login/register API call.
  // Does NOT make any API call — the page handles that.
  const setSession = (data) => {
    localStorage.setItem("docai_token", data.token);
    localStorage.setItem("docai_email", data.email);
    localStorage.setItem("docai_fullName", data.fullName || "");
    setUser({ email: data.email, fullName: data.fullName });
  };

  const logout = () => {
    localStorage.removeItem("docai_token");
    localStorage.removeItem("docai_email");
    localStorage.removeItem("docai_fullName");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
