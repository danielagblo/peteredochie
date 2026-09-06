/** Group book products by category (relation or legacy string field). */
export function groupBooksByCategory(books, categories) {
    const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
    const groups = new Map();

    for (const book of books) {
        const catId = book.expand?.book_category?.id || book.book_category?.id || book.book_category || book.category || '';
        const cat = byId[catId] || { id: catId, name: catId || 'Uncategorised', sort: 999 };
        if (!groups.has(cat.id || '__none')) {
            groups.set(cat.id || '__none', { category: cat, books: [] });
        }
        groups.get(cat.id || '__none').books.push(book);
    }

    return Array.from(groups.values()).sort(
        (a, b) => (a.category.sort ?? 999) - (b.category.sort ?? 999) || a.category.name.localeCompare(b.category.name),
    );
}

export const emptyBookForm = {
    name: '',
    edition: '',
    description: '',
    excerpt: '',
    author: 'Peter Edochie',
    isbn: '',
    pages: '',
    language: 'English',
    published_year: '',
    format: 'hardcopy',
    price: '',
    status: 'preorder',
    inventory_limit: '',
    current_stock: '',
    low_stock_threshold: '10',
    enabled: true,
    main_order_enabled: false,
    external_url: '',
    image: '',
    book_category: '',
};

export const emptyCategoryForm = {
    name: '',
    slug: '',
    description: '',
    sort: '',
    enabled: true,
};
