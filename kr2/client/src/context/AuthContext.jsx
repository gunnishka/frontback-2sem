import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { login as apiLogin, register as apiRegister, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка пользователя при старте приложения
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await getMe();
      setUser(data);
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.clear(); // очищаем токены
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Логин
  const login = useCallback(async (email, password) => {
    const { data } = await apiLogin({ email, password });

    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }

    // Получаем данные пользователя
    const meResponse = await getMe();
    setUser(meResponse.data);

    return meResponse.data;
  }, []);

  // Регистрация (обычно после регистрации сразу логиним или перенаправляем)
  const register = useCallback(async (formData) => {
    const { data } = await apiRegister(formData);
    return data;
  }, []);

  // Выход
  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loadUser, // можно использовать при необходимости
  };

  return (
    <AuthContext.Provider value={value}>
      {children} {/* ← Важно: убрал !loading && children */}
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
