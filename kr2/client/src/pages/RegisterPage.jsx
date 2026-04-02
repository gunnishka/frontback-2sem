import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { Input, Button, Alert } from "../components/UI";
import { register } from "../api";
import styles from "./AuthPage.module.css";

const ROLES = [
  { value: "user", label: "Пользователь" },
  { value: "seller", label: "Продавец" },
  { value: "admin", label: "Администратор" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "user",
  });
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
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Заполните форму для регистрации"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <Alert type="error">{error}</Alert>}
        <div className={styles.row}>
          <Input
            label="Имя"
            name="first_name"
            placeholder="Иван"
            value={form.first_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Фамилия"
            name="last_name"
            placeholder="Иванов"
            value={form.last_name}
            onChange={handleChange}
            required
          />
        </div>
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
        <div className={styles.field}>
          <label className={styles.label}>Роль</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={styles.select}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          loading={loading}
          style={{ width: "100%", marginTop: 8 }}
        >
          Зарегистрироваться
        </Button>
        <p className={styles.switch}>
          Уже есть аккаунт?{" "}
          <Link to="/login" className={styles.link}>
            Войти →
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
