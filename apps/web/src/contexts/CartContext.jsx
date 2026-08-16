import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'pel_cart';

const lineKey = (item) => (item.variant ? `${item.product_id}|${item.variant}` : item.product_id);

const readCart = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(readCart);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (_) {
            /* storage unavailable */
        }
    }, [items]);

    // variant is an optional string like "Size: L · Color: Black".
    const add = (productId, quantity = 1, variant = '') => {
        setItems((prev) => {
            const key = variant ? `${productId}|${variant}` : productId;
            const existing = prev.find((i) => lineKey(i) === key);
            if (existing) {
                return prev.map((i) =>
                    lineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
                );
            }
            return [...prev, { product_id: productId, quantity, variant }];
        });
    };

    const setQty = (productId, quantity, variant = '') => {
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const key = variant ? `${productId}|${variant}` : productId;
        setItems((prev) => prev.map((i) => (lineKey(i) === key ? { ...i, quantity: qty } : i)));
    };

    const remove = (productId, variant = '') => {
        const key = variant ? `${productId}|${variant}` : productId;
        setItems((prev) => prev.filter((i) => lineKey(i) !== key));
    };

    const clear = () => setItems([]);

    const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

    const value = useMemo(
        () => ({ items, add, setQty, remove, clear, count }),
        [items, count],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

export default CartContext;
