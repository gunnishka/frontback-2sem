import React, { useEffect, useState } from "react";
import "./SneakersPage.scss";
import SneakersList from "../../components/SneakersList";
import SneakerModal from "../../components/SneakerModal";
import { api } from "../../api";
export default function SneakersPage() {
    const [sneakers, setSneakers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // create | edit
    const [editingSneaker, setEditingSneaker] = useState(null);
    useEffect(() => {
        loadSneakers();
    }, []);
    const loadSneakers = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setSneakers(data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
        }
    };
    const openCreate = () => {
        setModalMode("create");
        setEditingSneaker(null);
        setModalOpen(true);
    };
    const openEdit = (sneaker) => {
        setModalMode("edit");
        setEditingSneaker(sneaker);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditingSneaker(null);
    };
    const handleDelete = async (id) => {
        const ok = window.confirm("Удалить товар?");
        if (!ok) return;
        try {
            await api.deleteProduct(id);
            setSneakers((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };
    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const newSneaker = await api.createProduct(payload);
                setSneakers((prev) => [...prev, newSneaker]);
            } else {
                const updatedSneaker = await api.updateProduct(payload.id, payload);
                setSneakers((prev) =>
                    prev.map((s) => (s.id === payload.id ? updatedSneaker : s))
                );
            }
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения товара");
        }
    };
    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">Sneakers Shop</div>
                    <div className="header__right">React</div>
                </div>
            </header>
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Кроссовки</h1>
                        <button className="btn btn--primary" onClick={openCreate}>
                            + Добавить
                        </button>
                    </div>
                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : (
                        <SneakersList
                            sneakers={sneakers}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </main>
            <footer className="footer">
                <div className="footer__inner">
                    © {new Date().getFullYear()} Sneakers Shop
                </div>
            </footer>
            <SneakerModal
                open={modalOpen}
                mode={modalMode}
                initialSneaker={editingSneaker}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}
