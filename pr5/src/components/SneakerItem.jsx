import React from "react";
export default function SneakerItem({ sneaker, onEdit, onDelete }) {
    return (
        <div className="card">
            <div className="card__image">
                <span className="card__icon">👟</span>
            </div>
            <div className="card__content">
                <div className="card__meta">
                    <span className="card__category">{sneaker.category}</span>
                    <span className="card__id">#{sneaker.id}</span>
                </div>
                <h2 className="card__title">{sneaker.name}</h2>
                <p className="card__description">{sneaker.description}</p>
                <div className="card__footer">
                    <div className="card__info">
                        <span className="card__price">{sneaker.price.toLocaleString('ru-RU')} ₽</span>
                        <span className="card__stock">На складе: {sneaker.stock} шт.</span>
                    </div>
                    <div className="card__actions">
                        <button className="btn" onClick={() => onEdit(sneaker)}>
                            Редактировать
                        </button>
                        <button className="btn btn--danger" onClick={() => onDelete(sneaker.id)}>
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
