import React from "react";
import SneakerItem from "./SneakerItem";
export default function SneakersList({ sneakers, onEdit, onDelete }) {
    if (!sneakers.length) {
        return <div className="empty">Товаров пока нет</div>;
    }
    return (
        <div className="grid">
            {sneakers.map((s) => (
                <SneakerItem key={s.id} sneaker={s} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </div>
    );
}
