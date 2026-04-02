import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsers, updateUser, blockUser } from "../api";
import { Button, Badge, Modal, Input, Alert } from "../components/UI";
import styles from "./UsersPage.module.css";

const ROLE_LABELS = {
  user: "Пользователь",
  seller: "Продавец",
  admin: "Администратор",
};
const ROLE_COLORS = { user: "default", seller: "accent", admin: "danger" };

function EditUserForm({ initial, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    first_name: initial.first_name,
    last_name: initial.last_name,
    email: initial.email,
    role: initial.role,
  });
  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      className={styles.editForm}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      {error && <Alert type="error">{error}</Alert>}
      <div className={styles.editRow}>
        <Input
          label="Имя"
          name="first_name"
          value={form.first_name}
          onChange={set}
          required
        />
        <Input
          label="Фамилия"
          name="last_name"
          value={form.last_name}
          onChange={set}
          required
        />
      </div>
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={set}
        required
      />
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Роль</label>
        <select
          name="role"
          value={form.role}
          onChange={set}
          className={styles.select}
        >
          <option value="user">Пользователь</option>
          <option value="seller">Продавец</option>
          <option value="admin">Администратор</option>
        </select>
      </div>
      <Button
        type="submit"
        loading={loading}
        style={{ width: "100%", marginTop: 4 }}
      >
        Сохранить
      </Button>
    </form>
  );
}

function UserRow({ user, onEdit, onBlock, currentUserId }) {
  const [blocking, setBlocking] = useState(false);
  const isSelf = user.id === currentUserId;

  const handleBlock = async () => {
    if (!window.confirm(`Заблокировать ${user.email}?`)) return;
    setBlocking(true);
    await onBlock(user.id);
    setBlocking(false);
  };

  return (
    <div className={`${styles.row} ${user.blocked ? styles.rowBlocked : ""}`}>
      <div className={styles.rowInfo}>
        <div className={styles.rowName}>
          {user.first_name} {user.last_name}{" "}
          {isSelf && <span className={styles.selfTag}>вы</span>}
        </div>
        <div className={styles.rowEmail}>{user.email}</div>
      </div>
      <div className={styles.rowMeta}>
        <Badge variant={user.blocked ? "default" : ROLE_COLORS[user.role]}>
          {user.blocked ? "Заблокирован" : ROLE_LABELS[user.role]}
        </Badge>
        <span className={styles.rowId}>#{user.id}</span>
      </div>
      {!isSelf && (
        <div className={styles.rowActions}>
          <Button variant="ghost" onClick={() => onEdit(user)}>
            Изменить
          </Button>
          {!user.blocked && (
            <Button variant="danger" loading={blocking} onClick={handleBlock}>
              Блок
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = async (form) => {
    setFormLoading(true);
    setFormError("");
    try {
      const { data } = await updateUser(editTarget.id, form);
      setUsers((u) => u.map((x) => (x.id === data.id ? data : x)));
      setEditTarget(null);
    } catch (err) {
      setFormError(err.response?.data?.error || "Ошибка обновления");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBlock = async (id) => {
    try {
      await blockUser(id);
      setUsers((u) =>
        u.map((x) => (x.id === id ? { ...x, blocked: true } : x)),
      );
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка блокировки");
    }
  };

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span>S</span>
            <span>H</span>
            <span>P</span>
          </div>
          <div>
            <h1 className={styles.heading}>Пользователи</h1>
            <p className={styles.subheading}>
              {loading ? "Загрузка..." : `${users.length} аккаунтов`}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link to="/products">
            <Button variant="secondary">← Товары</Button>
          </Link>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.stats}>
          <span>{users.filter((u) => !u.blocked).length} активных</span>
          <span className={styles.dot}>·</span>
          <span>{users.filter((u) => u.blocked).length} заблокированных</span>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className={styles.skeletonRow}
              style={{ animationDelay: `${i * 0.06}s` }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>◈</span>
            <p>Пусто</p>
          </div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="animate-in">
              <UserRow
                user={u}
                onEdit={(u) => {
                  setEditTarget(u);
                  setFormError("");
                }}
                onBlock={handleBlock}
                currentUserId={currentUser?.id}
              />
            </div>
          ))
        )}
      </div>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Редактировать пользователя"
      >
        {editTarget && (
          <EditUserForm
            initial={editTarget}
            onSubmit={handleEdit}
            loading={formLoading}
            error={formError}
          />
        )}
      </Modal>
    </div>
  );
}
