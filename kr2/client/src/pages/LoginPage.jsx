import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Input, Button, Alert } from "../components/UI";
import styles from "./AuthPage.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Добро пожаловать" subtitle="Войдите в свой аккаунт">
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <Alert type="error">{error}</Alert>}
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="ivanov@mail.ru"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Пароль"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button
          type="submit"
          loading={loading}
          style={{ width: "100%", marginTop: 8 }}
        >
          Войти
        </Button>
        <p className={styles.switch}>
          Нет аккаунта?{" "}
          <Link to="/register" className={styles.link}>
            Зарегистрироваться →
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
