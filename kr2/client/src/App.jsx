import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";

// Защищённый маршрут с поддержкой ролей
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>; // ← замени на нормальный спиннер позже
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если указаны allowedRoles и у пользователя роль не подходит — редирект
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/products" replace />;
  }

  return children;
}

// Публичный маршрут (только для неавторизованных)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Загрузка...</div>;

  return !user ? children : <Navigate to="/products" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Доступно всем авторизованным пользователям */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          {/* Доступно только админам */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* На всякий случай — 404 */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
