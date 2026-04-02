import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api";
import { Button, Input, Badge, Modal, Alert } from "../components/UI";
import styles from "./ProductsPage.module.css";

const EMPTY_FORM = { title: "", category: "", description: "", price: "" };

const ROLE_LABELS = {
  user: "Пользователь",
  seller: "Продавец",
  admin: "Администратор",
};
const ROLE_COLORS = { user: "default", seller: "accent", admin: "danger" };

function ProductForm({
  initial = EMPTY_FORM,
  onSubmit,
  loading,
  error,
  submitLabel,
}) {
  const [form, setForm] = useState(initial);
  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  useEffect(() => {
    setForm(initial);
  }, [initial, initial.title]);

  return (
    <form
      className={styles.formGrid}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      {error && (
        <div className={styles.formError}>
          <Alert type="error">{error}</Alert>
        </div>
      )}
      <Input
        label="Название"
        name="title"
        placeholder="Nike Air Force"
        value={form.title}
        onChange={set}
        required
      />
      <Input
        label="Категория"
        name="category"
        placeholder="Обувь"
        value={form.category}
        onChange={set}
        required
      />
      <Input
        label="Описание"
        name="description"
        placeholder="Описание товара..."
        value={form.description}
        onChange={set}
        required
      />
      <Input
        label="Цена (₽)"
        name="price"
        type="number"
        placeholder="4990"
        value={form.price}
        onChange={set}
        required
        min="0"
      />
      <Button
        type="submit"
        loading={loading}
        style={{ gridColumn: "1/-1", marginTop: 4 }}
      >
        {submitLabel}
      </Button>
    </form>
  );
}

function ProductCard({ product, onEdit, onDelete, canEdit, canDelete }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(product.id);
    setDeleting(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <Badge variant="accent">{product.category}</Badge>
        <span className={styles.cardId}>#{product.id}</span>
      </div>
      <h3 className={styles.cardTitle}>{product.title}</h3>
      <p className={styles.cardDesc}>{product.description}</p>
      <div className={styles.cardFooter}>
        <span className={styles.cardPrice}>
          {Number(product.price).toLocaleString("ru-RU")} ₽
        </span>
        <div className={styles.cardActions}>
          {canEdit && (
            <Button variant="ghost" onClick={() => onEdit(product)}>
              Ред.
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Удал.
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const canCreate = user?.role === "seller" || user?.role === "admin";
  const canEdit = user?.role === "seller" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await getProducts();
      setProducts(data);
    } catch {
      /* interceptor handles */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = async (form) => {
    setFormLoading(true);
    setFormError("");
    try {
      const { data } = await createProduct(form);
      setProducts((p) => [data, ...p]);
      setCreateOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Ошибка создания");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setFormLoading(true);
    setFormError("");
    try {
      const { data } = await updateProduct(editTarget.id, form);
      setProducts((p) => p.map((x) => (x.id === data.id ? data : x)));
      setEditTarget(null);
    } catch (err) {
      setFormError(err.response?.data?.error || "Ошибка обновления");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка удаления");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()),
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
            <h1 className={styles.heading}>Товары</h1>
            <p className={styles.subheading}>
              {loading ? "Загрузка..." : `${products.length} позиций`}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{user?.email}</span>
            <Badge variant={ROLE_COLORS[user?.role]}>
              {ROLE_LABELS[user?.role]}
            </Badge>
          </div>
          {user?.role === "admin" && (
            <Link to="/users">
              <Button variant="secondary">Пользователи</Button>
            </Link>
          )}
          {canCreate && (
            <Button
              variant="primary"
              onClick={() => {
                setCreateOpen(true);
                setFormError("");
              }}
            >
              + Добавить
            </Button>
          )}
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск по названию или категории..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.skeleton}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={styles.skeletonCard}
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◈</span>
          <p>{search ? "Ничего не найдено" : "Нет товаров."}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((product, i) => (
            <div
              key={product.id}
              style={{ animationDelay: `${i * 0.04}s` }}
              className="animate-in"
            >
              <ProductCard
                product={product}
                onEdit={(p) => {
                  setEditTarget(p);
                  setFormError("");
                }}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый товар"
      >
        <ProductForm
          onSubmit={handleCreate}
          loading={formLoading}
          error={formError}
          submitLabel="Создать товар"
        />
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Редактировать товар"
      >
        {editTarget && (
          <ProductForm
            initial={editTarget}
            onSubmit={handleEdit}
            loading={formLoading}
            error={formError}
            submitLabel="Сохранить"
          />
        )}
      </Modal>
    </div>
  );
}
