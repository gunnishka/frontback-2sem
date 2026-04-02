import React, { useEffect, useState } from "react";
export default function SneakerModal({ open, mode, initialSneaker, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    useEffect(() => {
        if (!open) return;
        setName(initialSneaker?.name ?? "");
        setCategory(initialSneaker?.category ?? "");
        setDescription(initialSneaker?.description ?? "");
        setPrice(initialSneaker?.price != null ? String(initialSneaker.price) : "");
        setStock(initialSneaker?.stock != null ? String(initialSneaker.stock) : "");
    }, [open, initialSneaker]);
    if (!open) return null;
    const title = mode === "edit" ? "Редактирование товара" : "Создание товара";
    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedPrice = Number(price);
        const parsedStock = Number(stock);
        if (!trimmedName) { alert("Введите название"); return; }
        if (!trimmedCategory) { alert("Введите категорию"); return; }
        if (!trimmedDescription) { alert("Введите описание"); return; }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { alert("Введите корректную цену"); return; }
        if (!Number.isFinite(parsedStock) || parsedStock < 0) { alert("Введите корректное количество"); return; }
        onSubmit({
            id: initialSneaker?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDescription,
            price: parsedPrice,
            stock: parsedStock,
        });
    };
    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>
                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Nike Air Force 1" autoFocus />
                    </label>
                    <label className="label">
                        Категория
                        <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Например, Классика" />
                    </label>
                    <label className="label">
                        Описание
                        <textarea className="input input--textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание товара" rows={3} />
                    </label>
                    <label className="label">
                        Цена (₽)
                        <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Например, 8990" inputMode="numeric" />
                    </label>
                    <label className="label">
                        Количество на складе
                        <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Например, 25" inputMode="numeric" />
                    </label>
                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
