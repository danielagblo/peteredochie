import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, CreditCard, FileText, Gauge, Globe, Handshake, Landmark, Mail, Package, ShoppingCart, TrendingDown, Truck, Users, GraduationCap, UserCog } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import MentorshipApplicationRow from '@/components/dashboard/MentorshipApplicationRow';
import { ACCOUNT_LABEL } from '@/lib/accounts';
import { formatUSD } from '@/lib/commerce';
import { REGISTRATION_TYPES, registrationTypeLabel } from '@/lib/mentorship';
import { emptyBookForm, emptyCategoryForm } from '@/lib/books';
import ProductQrPanel from '@/components/ProductQrPanel';
import NewsletterBroadcastPanel from '@/components/dashboard/NewsletterBroadcastPanel';
import { apiCrud } from '@/lib/api';

const ALL_NAV = [
    { key: 'analytics', label: 'Analytics', icon: Gauge },
    { key: 'events', label: 'Events', icon: CalendarDays },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'distributors', label: 'Distributors', icon: Truck },
    { key: 'sponsors', label: 'Sponsors', icon: Handshake },
    { key: 'sponsorships', label: 'Sponsorships', icon: Landmark },
    { key: 'mentorship', label: 'Mentorship', icon: GraduationCap },
    { key: 'books', label: 'Books', icon: BookOpen },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { key: 'packages', label: 'Packages & Pricing', icon: Handshake },
    { key: 'orders', label: 'Sales & Orders', icon: ShoppingCart },
    { key: 'tracking', label: 'Stock Tracking', icon: TrendingDown },
    { key: 'employees', label: 'Employees', icon: UserCog },
    { key: 'countries', label: 'Countries', icon: Globe },
    { key: 'cms', label: 'CMS', icon: FileText },
    { key: 'newsletter', label: 'Newsletter & Broadcasts', icon: Mail },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
];

const ROLE_TABS = {
    super_admin: null, // all
    inventory_manager: ['inventory', 'tracking'],
    sales_manager: ['orders'],
    fulfillment_officer: ['orders'],
    country_manager: ['countries', 'events', 'orders'],
    sponsorship_manager: ['sponsorships'],
};

const input = 'w-full border border-border bg-card text-foreground px-4 py-3 text-sm outline-none focus:border-[hsl(var(--gold))]';
const smallBtn = 'border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]';
const dangerBtn = 'border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const PRODUCT_TYPES = ['book', 'merchandise', 'ticket'];
const FORMATS = ['hardcopy', 'digital'];
const STATUSES = ['preorder', 'main_order', 'unavailable'];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const EMPLOYEE_ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'fulfillment_officer', label: 'Fulfillment Officer' },
    { value: 'country_manager', label: 'Country Manager' },
    { value: 'sponsorship_manager', label: 'Sponsorship Manager' },
];

const emptyProductForm = {
    name: '', description: '', format: 'hardcopy', price: '', edition: '',
    product_type: 'book', status: 'preorder', inventory_limit: '', current_stock: '',
    low_stock_threshold: '10', enabled: true, main_order_enabled: false, external_url: '', image: '',
    book_category: '', author: '', isbn: '', pages: '', language: 'English', excerpt: '', published_year: '',
};

const AdminDashboard = ({ role = 'super_admin' }) => {
    const allowedTabs = ROLE_TABS[role];
    const authorized = role in ROLE_TABS;
    const nav = useMemo(
        () => (allowedTabs ? ALL_NAV.filter((n) => allowedTabs.includes(n.key)) : ALL_NAV),
        [allowedTabs],
    );

    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [news, setNews] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [sponsorships, setSponsorships] = useState([]);
    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [products, setProducts] = useState([]);
    const [bookCategories, setBookCategories] = useState([]);
    const [bookPreregistrations, setBookPreregistrations] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [orders, setOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [error, setError] = useState('');
    const [eventForm, setEventForm] = useState({ title: '', city: '', venue: '', starts: '', summary: '', category: '', event_type: 'masterclass' });
    const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', category: '' });
    const [sponsorPackages, setSponsorPackages] = useState([]);
    const [distTiers, setDistTiers] = useState([]);
    const [ticketEventId, setTicketEventId] = useState('');
    const [ticketTierForm, setTicketTierForm] = useState({ key: '', name: '', price: '' });
    const [tierForm, setTierForm] = useState({ name: '', min_units: '', max_units: '', discount: '', terms: '', enabled: true });
    const [editingTierId, setEditingTierId] = useState(null);
    const [sponsorPkgForm, setSponsorPkgForm] = useState({ name: '', tier: '', price: '', currency: 'USD', description: '', duration: '12 months', benefits: '', image: '', enabled: true, sort: '' });
    const [editingSponsorPkgId, setEditingSponsorPkgId] = useState(null);
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [bookForm, setBookForm] = useState(emptyBookForm);
    const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
    const [editingId, setEditingId] = useState(null);
    const [editingBookId, setEditingBookId] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [orderFilter, setOrderFilter] = useState({ status: 'all', product: 'all' });
    const [empForm, setEmpForm] = useState({ user: '', role: 'inventory_manager' });
    const [adjustForm, setAdjustForm] = useState({ product: '', delta: '', reason: '' });
    const [countryForm, setCountryForm] = useState({ name: '', code: '', currency: '', status: 'coming_soon', launch_date: '', regional_coordinator: '', primary_distributor: '' });
    const [materialForm, setMaterialForm] = useState({
        title: '', description: '', module: '', cohort: '2027', registration_type: 'standard', sort: '', url: '', video_url: '', published: true,
    });

    const load = useCallback(async () => {
        if (!authorized) return;
        const fetchAll = (allowedTabs == null);
        const tabSet = new Set(allowedTabs || []);
        const has = (key) => fetchAll || tabSet.has(key);

        const fetchers = {
            users: () => apiCrud.list('users', { sort: '-created' }).catch(() => []),
            events: () => apiCrud.list('events', { sort: 'starts' }).catch(() => []),
            news: () => apiCrud.list('news', { sort: '-created' }).catch(() => []),
            products: () => apiCrud.list('products', { sort: '-created' }).catch(() => []),
            enquiries: () => apiCrud.list('enquiries', { sort: '-created' }).catch(() => []),
            orders: () => apiCrud.list('orders', { sort: '-created' }).catch(() => []),
            movements: () => apiCrud.list('stock-movements', { sort: '-created' }).catch(() => []),
            employees: () => apiCrud.list('employee-roles', { sort: '-created' }).catch(() => []),
            subscribers: () => apiCrud.list('subscribers', { sort: '-created' }).catch(() => []),
            applications: () => apiCrud.list('mentorship-applications', { sort: '-created' }).catch(() => []),
            materials: () => apiCrud.list('mentorship-materials', { sort: 'sort,title' }).catch(() => []),
            sponsorships: () => apiCrud.list('sponsorships', { sort: '-created' }).catch(() => []),
            countries: () => apiCrud.list('countries', { sort: 'name' }).catch(() => []),
            regions: () => apiCrud.list('regions', { sort: 'name' }).catch(() => []),
            bookCategories: () => apiCrud.list('book-categories', { sort: 'sort' }).catch(() => []),
            bookPreregs: () => apiCrud.list('book-preregistrations', { sort: '-created' }).catch(() => []),
            sponsorPackages: () => apiCrud.list('sponsorship-packages', { sort: 'sort' }).catch(() => []),
            distTiers: () => apiCrud.list('distributor-tiers', { sort: 'sort' }).catch(() => []),
        };

        const want = {
            users: () => has('users') || has('distributors') || has('countries'),
            events: () => has('analytics') || has('events') || has('countries'),
            news: () => has('analytics') || has('cms'),
            products: () => has('analytics') || has('books') || has('inventory') || has('tracking') || has('orders') || has('reports'),
            enquiries: () => has('analytics') || has('books') || has('cms'),
            orders: () => has('analytics') || has('orders') || has('reports'),
            movements: () => has('tracking'),
            employees: () => has('employees'),
            subscribers: () => has('analytics') || has('newsletter') || has('reports'),
            applications: () => has('mentorship'),
            materials: () => has('mentorship'),
            sponsorships: () => has('analytics') || has('sponsors') || has('sponsorships'),
            countries: () => has('analytics') || has('countries') || has('distributors') || has('newsletter'),
            regions: () => has('countries'),
            bookCategories: () => has('analytics') || has('books'),
            bookPreregs: () => has('analytics') || has('books'),
            sponsorPackages: () => has('analytics') || has('sponsors') || has('sponsorships') || has('packages'),
            distTiers: () => has('packages') || has('distributors'),
        };

        try {
            const results = await Promise.all(
                Object.keys(fetchers).map(async (k) => {
                    if (!want[k]()) return [];
                    try {
                        return await fetchers[k]();
                    } catch (_) {
                        return [];
                    }
                }),
            );
            const map = Object.fromEntries(Object.keys(fetchers).map((k, i) => [k, results[i]]));
            setUsers(map.users);
            setEvents(map.events);
            setNews(map.news);
            setProducts(map.products);
            setEnquiries(map.enquiries);
            setBookCategories(map.bookCategories || []);
            setBookPreregistrations(map.bookPreregs || []);
            setOrders(map.orders);
            setMovements(map.movements);
            setEmployees(map.employees);
            setSubscribers(map.subscribers);
            setApplications(map.applications);
            setMaterials(map.materials);
            setSponsorships(map.sponsorships);
            setCountries(map.countries);
            setRegions(map.regions);
            setSponsorPackages(map.sponsorPackages || []);
            setDistTiers(map.distTiers || []);
        } catch (_) {
            setError('Some administration data could not be loaded.');
        }
    }, [allowedTabs, authorized]);

    useEffect(() => {
        load();
    }, [load]);

    // Load line items for each order (expanded into a map by order id).
    useEffect(() => {
        if (orders.length === 0) return;
        let active = true;
        Promise.all(
            orders.map((o) =>
                apiCrud.list('order-items', { filter: `order = "${o.id}"` }).then((its) => [o.id, its]).catch(() => [o.id, []]),
            ),
        ).then((pairs) => {
            if (active) setOrderItems(Object.fromEntries(pairs));
        });
        return () => { active = false; };
    }, [orders]);

    const setApproval = async (id, status, extra = {}) => {
        try { await apiCrud.update('users', id, { approval_status: status, ...extra }); load(); }
        catch (_) { setError('Could not update that account.'); }
    };

    const setMentorshipStatus = async (id, status, registrationType) => {
        try {
            const app = applications.find((a) => a.id === id);
            const payload = { status };
            if (status === 'accepted') {
                payload.registration_type = registrationType || app?.registration_type || app?.requested_type || 'standard';
            }
            await apiCrud.update('mentorship-applications', id, payload);
            load();
        } catch (_) { setError('Could not update that application.'); }
    };

    const setMentorshipRegistrationType = async (id, registrationType) => {
        try {
            await apiCrud.update('mentorship-applications', id, { registration_type: registrationType });
            load();
        } catch (_) { setError('Could not update registration type.'); }
    };

    const createMaterial = async (e) => {
        e.preventDefault();
        try {
            await apiCrud.create('mentorship-materials', {
                ...materialForm,
                sort: materialForm.sort === '' ? 0 : Number(materialForm.sort),
                published: !!materialForm.published,
            });
            setMaterialForm({
                title: '', description: '', module: '', cohort: '2027', registration_type: 'standard', sort: '', url: '', video_url: '', published: true,
            });
            load();
        } catch (_) { setError('Could not publish that material.'); }
    };

    const deleteMaterial = async (id) => {
        try { await apiCrud.remove('mentorship-materials', id); load(); }
        catch (_) { setError('Could not delete that material.'); }
    };

    const createEvent = async (e) => {
        e.preventDefault();
        try {
            await apiCrud.create('events', { ...eventForm, starts: eventForm.starts || null });
            setEventForm({ title: '', city: '', venue: '', starts: '', summary: '', category: '', event_type: 'masterclass' });
            load();
        } catch (_) { setError('Could not create that event.'); }
    };

    const deleteEvent = async (id) => {
        try { await apiCrud.remove('events', id); load(); }
        catch (_) { setError('Could not delete that event.'); }
    };

    const createNews = async (e) => {
        e.preventDefault();
        try {
            await apiCrud.create('news', { ...newsForm, published: new Date().toISOString() });
            setNewsForm({ title: '', excerpt: '', category: '' });
            load();
        } catch (_) { setError('Could not publish that entry.'); }
    };

    const bookPayload = (form) => ({
        name: form.name,
        edition: form.edition,
        description: form.description,
        excerpt: form.excerpt,
        author: form.author,
        isbn: form.isbn,
        pages: form.pages === '' ? null : Number(form.pages),
        language: form.language,
        published_year: form.published_year,
        format: form.format,
        product_type: 'book',
        book_category: form.book_category || '',
        status: form.status,
        price: form.price === '' ? 0 : Number(form.price),
        inventory_limit: form.inventory_limit === '' ? 0 : Number(form.inventory_limit),
        current_stock: form.current_stock === '' ? 0 : Number(form.current_stock),
        low_stock_threshold: form.low_stock_threshold === '' ? 0 : Number(form.low_stock_threshold),
        enabled: form.enabled,
        main_order_enabled: form.main_order_enabled,
        external_url: form.external_url || '',
        image: form.image || '',
    });

    const saveBook = async (e) => {
        e.preventDefault();
        try {
            const payload = bookPayload(bookForm);
            if (editingBookId) {
                await apiCrud.update('products', editingBookId, payload);
            } else {
                await apiCrud.create('products', payload);
            }
            setBookForm(emptyBookForm);
            setEditingBookId(null);
            load();
        } catch (_) { setError('Could not save that book.'); }
    };

    const editBook = (p) => {
        setEditingBookId(p.id);
        setBookForm({
            name: p.name || '',
            edition: p.edition || '',
            description: p.description || '',
            excerpt: p.excerpt || '',
            author: p.author || 'Peter Edochie',
            isbn: p.isbn || '',
            pages: p.pages ?? '',
            language: p.language || 'English',
            published_year: p.published_year || '',
            format: p.format || 'hardcopy',
            price: p.price ?? '',
            status: p.status || 'preorder',
            inventory_limit: p.inventory_limit ?? '',
            current_stock: p.current_stock ?? '',
            low_stock_threshold: p.low_stock_threshold ?? 10,
            enabled: !!p.enabled,
            main_order_enabled: !!p.main_order_enabled,
            external_url: p.external_url || '',
            image: p.image || '',
            book_category: p.expand?.book_category?.id || p.book_category?.id || p.book_category || '',
        });
    };

    const deleteBook = async (id) => {
        try {
            await apiCrud.remove('products', id);
            if (editingBookId === id) {
                setEditingBookId(null);
                setBookForm(emptyBookForm);
            }
            load();
        } catch (_) { setError('Could not delete that book.'); }
    };

    const saveCategory = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: categoryForm.name,
                slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                description: categoryForm.description,
                sort: categoryForm.sort === '' ? 0 : Number(categoryForm.sort),
                enabled: categoryForm.enabled,
            };
            if (editingCategoryId) {
                await apiCrud.update('book-categories', editingCategoryId, payload);
            } else {
                await apiCrud.create('book-categories', payload);
            }
            setCategoryForm(emptyCategoryForm);
            setEditingCategoryId(null);
            load();
        } catch (_) { setError('Could not save that category.'); }
    };

    const editCategory = (c) => {
        setEditingCategoryId(c.id);
        setCategoryForm({
            name: c.name || '',
            slug: c.slug || '',
            description: c.description || '',
            sort: c.sort ?? '',
            enabled: true,
        });
    };

    const deleteCategory = async (id) => {
        try {
            await apiCrud.remove('book-categories', id);
            if (editingCategoryId === id) {
                setEditingCategoryId(null);
                setCategoryForm(emptyCategoryForm);
            }
            load();
        } catch (_) { setError('Could not delete that category.'); }
    };

    const updatePreregStatus = async (id, status) => {
        try {
            await apiCrud.update('book-preregistrations', id, { status });
            setBookPreregistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        } catch (_) { setError('Could not update pre-registration status.'); }
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...productForm,
                price: productForm.price === '' ? 0 : Number(productForm.price),
                inventory_limit: productForm.inventory_limit === '' ? 0 : Number(productForm.inventory_limit),
                current_stock: productForm.current_stock === '' ? 0 : Number(productForm.current_stock),
                low_stock_threshold: productForm.low_stock_threshold === '' ? 0 : Number(productForm.low_stock_threshold),
                pages: productForm.pages === '' ? null : Number(productForm.pages),
                external_url: productForm.external_url || '',
                image: productForm.image || '',
                book_category: productForm.book_category || '',
            };
            if (editingId) {
                await apiCrud.update('products', editingId, payload);
            } else {
                await apiCrud.create('products', payload);
            }
            setProductForm(emptyProductForm);
            setEditingId(null);
            load();
        } catch (_) { setError('Could not save that product.'); }
    };

    const editProduct = (p) => {
        setEditingId(p.id);
        setProductForm({
            name: p.name, description: p.description || '', format: p.format || 'hardcopy',
            price: p.price ?? '', edition: p.edition || '', product_type: p.product_type || 'book',
            status: p.status || 'preorder', inventory_limit: p.inventory_limit ?? '',
            current_stock: p.current_stock ?? '', low_stock_threshold: p.low_stock_threshold ?? 10,
            enabled: !!p.enabled, main_order_enabled: !!p.main_order_enabled,
            external_url: p.external_url || '', image: p.image || '',
            book_category: p.book_category || p.expand?.book_category?.id || '',
            author: p.author || '', isbn: p.isbn || '', pages: p.pages ?? '',
            language: p.language || '', excerpt: p.excerpt || '', published_year: p.published_year || '',
        });
    };

    const deleteProduct = async (id) => {
        try { await apiCrud.remove('products', id); if (editingId === id) { setEditingId(null); setProductForm(emptyProductForm); } load(); }
        catch (_) { setError('Could not delete that product.'); }
    };

    const quickToggle = async (p, field) => {
        try { await apiCrud.update('products', p.id, { [field]: !p[field] }); load(); }
        catch (_) { setError('Could not toggle that product.'); }
    };

    const updateOrderStatus = async (id, order_status) => {
        try { await apiCrud.update('orders', id, { order_status }); load(); }
        catch (_) { setError('Could not update that order.'); }
    };

    const updateOrderMeta = async (id, patch) => {
        try { await apiCrud.update('orders', id, patch); load(); }
        catch (_) { setError('Could not update that order.'); }
    };

    const adjustStock = async (e) => {
        e.preventDefault();
        const product = products.find((p) => p.id === adjustForm.product);
        if (!product) { setError('Select a product to adjust stock.'); return; }
        const delta = parseInt(adjustForm.delta, 10);
        if (!Number.isFinite(delta)) { setError('Enter a valid quantity change.'); return; }
        const prev = Number(product.current_stock) || 0;
        const next = Math.max(0, prev + delta);
        try {
            await apiCrud.update('products', product.id, { current_stock: next });
            await apiCrud.create('stock-movements', {
                product: product.id, quantity_change: delta, previous_stock: prev, new_stock: next,
                reason: adjustForm.reason || 'Manual adjustment',
            });
            setAdjustForm({ product: '', delta: '', reason: '' });
            load();
        } catch (_) { setError('Could not adjust stock.'); }
    };

    const assignEmployee = async (e) => {
        e.preventDefault();
        if (!empForm.user) { setError('Select a user to assign a role.'); return; }
        try {
            // Mirror the role onto the user's staff_role for rule enforcement.
            await apiCrud.update('users', empForm.user, { staff_role: empForm.role });
            // Upsert the employee_roles record.
            const existing = employees.find((e) => String(e.user?.id || e.user) === empForm.user);
            if (existing) {
                await apiCrud.update('employee-roles', existing.id, { role: empForm.role });
            } else {
                await apiCrud.create('employee-roles', { user: empForm.user, role: empForm.role, permissions: {} });
            }
            setEmpForm({ user: '', role: 'inventory_manager' });
            load();
        } catch (_) { setError('Could not assign that role.'); }
    };

    const revokeEmployee = async (emp) => {
        try {
            await apiCrud.update('users', emp.user?.id || emp.user, { staff_role: '' });
            await apiCrud.remove('employee-roles', emp.id);
            load();
        } catch (_) { setError('Could not revoke that role.'); }
    };

    const setSponsorshipStatus = async (id, status) => {
        try { await apiCrud.update('sponsorships', id, { status }); load(); }
        catch (_) { setError('Could not update that sponsorship.'); }
    };

    const setSponsorshipPayment = async (id, payment_status) => {
        try { await apiCrud.update('sponsorships', id, { payment_status }); load(); }
        catch (_) { setError('Could not update that payment.'); }
    };

    const toggleSponsorPkg = async (p) => {
        try { await apiCrud.update('sponsorship-packages', p.id, { enabled: !p.enabled }); load(); }
        catch (_) { setError('Could not toggle that package.'); }
    };

    const resetSponsorPkgForm = () => setSponsorPkgForm({ name: '', tier: '', price: '', currency: 'USD', description: '', duration: '12 months', benefits: '', image: '', enabled: true, sort: '' });

    const saveSponsorPkg = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: sponsorPkgForm.name,
                tier: sponsorPkgForm.tier,
                price: sponsorPkgForm.price === '' ? 0 : Number(sponsorPkgForm.price),
                currency: sponsorPkgForm.currency || 'USD',
                description: sponsorPkgForm.description || '',
                duration: sponsorPkgForm.duration || '',
                benefits: sponsorPkgForm.benefits ? sponsorPkgForm.benefits.split('\n').map((b) => b.trim()).filter(Boolean) : [],
                image: sponsorPkgForm.image || '',
                enabled: !!sponsorPkgForm.enabled,
                sort: sponsorPkgForm.sort === '' ? 0 : Number(sponsorPkgForm.sort),
            };
            if (editingSponsorPkgId) {
                await apiCrud.update('sponsorship-packages', editingSponsorPkgId, payload);
            } else {
                await apiCrud.create('sponsorship-packages', payload);
            }
            setEditingSponsorPkgId(null);
            resetSponsorPkgForm();
            load();
        } catch (_) { setError('Could not save that sponsorship package.'); }
    };

    const editSponsorPkg = (p) => {
        setEditingSponsorPkgId(p.id);
        setSponsorPkgForm({
            name: p.name || '', tier: p.tier || '', price: p.price ?? '',
            currency: p.currency || 'USD', description: p.description || '',
            duration: p.duration || '12 months',
            benefits: Array.isArray(p.benefits) ? p.benefits.join('\n') : '',
            image: p.image || '', enabled: !!p.enabled, sort: p.sort ?? '',
        });
    };

    const deleteSponsorPkg = async (id) => {
        try {
            await apiCrud.remove('sponsorship-packages', id);
            if (editingSponsorPkgId === id) { setEditingSponsorPkgId(null); resetSponsorPkgForm(); }
            load();
        } catch (_) { setError('Could not delete that sponsorship package.'); }
    };

    const resetTierForm = () => setTierForm({ name: '', min_units: '', max_units: '', discount: '', terms: '', enabled: true });

    const saveTier = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: tierForm.name,
                min_units: tierForm.min_units === '' ? null : Number(tierForm.min_units),
                max_units: tierForm.max_units === '' ? null : Number(tierForm.max_units),
                discount: tierForm.discount === '' ? 0 : Number(tierForm.discount),
                terms: tierForm.terms || '',
                enabled: !!tierForm.enabled,
            };
            if (editingTierId) {
                await apiCrud.update('distributor-tiers', editingTierId, payload);
            } else {
                await apiCrud.create('distributor-tiers', payload);
            }
            setEditingTierId(null);
            resetTierForm();
            load();
        } catch (_) { setError('Could not save that distributor tier.'); }
    };

    const editTier = (t) => {
        setEditingTierId(t.id);
        setTierForm({
            name: t.name || '', min_units: t.min_units ?? '', max_units: t.max_units ?? '',
            discount: t.discount ?? '', terms: t.terms || '', enabled: !!t.enabled,
        });
    };

    const deleteTier = async (id) => {
        try {
            await apiCrud.remove('distributor-tiers', id);
            if (editingTierId === id) { setEditingTierId(null); resetTierForm(); }
            load();
        } catch (_) { setError('Could not delete that distributor tier.'); }
    };

    const toggleTier = async (t) => {
        try { await apiCrud.update('distributor-tiers', t.id, { enabled: !t.enabled }); load(); }
        catch (_) { setError('Could not toggle that tier.'); }
    };

    const selectedTicketEvent = events.find((ev) => ev.id === ticketEventId);
    const ticketTiers = Array.isArray(selectedTicketEvent?.ticket_tiers) ? selectedTicketEvent.ticket_tiers : [];

    const addTicketTier = async (e) => {
        e.preventDefault();
        if (!ticketEventId || !ticketTierForm.name || ticketTierForm.price === '') return;
        const next = [...ticketTiers, {
            key: ticketTierForm.key || ticketTierForm.name.toLowerCase().replace(/\s+/g, '_'),
            name: ticketTierForm.name,
            price: Number(ticketTierForm.price) || 0,
        }];
        try {
            await apiCrud.update('events', ticketEventId, { ticket_tiers: next });
            setTicketTierForm({ key: '', name: '', price: '' });
            load();
        } catch (_) { setError('Could not add that ticket tier.'); }
    };

    const removeTicketTier = async (idx) => {
        if (!ticketEventId) return;
        const next = ticketTiers.filter((_, i) => i !== idx);
        try {
            await apiCrud.update('events', ticketEventId, { ticket_tiers: next });
            load();
        } catch (_) { setError('Could not remove that ticket tier.'); }
    };

    const updateTicketEventPrice = async (id, price) => {
        try {
            await apiCrud.update('events', id, { price: price === '' ? 0 : Number(price) });
            load();
        } catch (_) { setError('Could not update that event price.'); }
    };

    const createCountry = async (e) => {
        e.preventDefault();
        if (!countryForm.name || !countryForm.code) { setError('Country name and code are required.'); return; }
        try {
            await apiCrud.create('countries', {
                name: countryForm.name,
                code: countryForm.code.toUpperCase(),
                currency: countryForm.currency || 'USD',
                status: countryForm.status,
                launch_date: countryForm.launch_date || null,
                regional_coordinator: countryForm.regional_coordinator || '',
                primary_distributor: countryForm.primary_distributor || '',
            });
            setCountryForm({ name: '', code: '', currency: '', status: 'coming_soon', launch_date: '', regional_coordinator: '', primary_distributor: '' });
            load();
        } catch (_) { setError('Could not add that country. The code may already exist.'); }
    };

    const updateCountryStatus = async (id, status) => {
        try { await apiCrud.update('countries', id, { status }); load(); }
        catch (_) { setError('Could not update that country.'); }
    };

    const assignCoordinator = async (id, userId) => {
        try { await apiCrud.update('countries', id, { regional_coordinator: userId || '' }); load(); }
        catch (_) { setError('Could not assign that coordinator.'); }
    };

    const assignPrimaryDistributor = async (id, userId) => {
        try { await apiCrud.update('countries', id, { primary_distributor: userId || '' }); load(); }
        catch (_) { setError('Could not assign that distributor.'); }
    };

    const exportOrdersCSV = () => {
        const rows = [['Reference', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Order status', 'Date', 'Tracking', 'Delivery']];
        filteredOrders.forEach((o) => {
            rows.push([
                o.payment_reference || o.id,
                o.owner?.name || o.owner?.email || o.email || '',
                o.email || '',
                o.items_summary || '',
                String(o.total_price ?? ''),
                o.payment_status || '',
                o.order_status || '',
                fmtDate(o.created),
                o.tracking_number || '',
                fmtDate(o.estimated_delivery),
            ]);
        });
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const byType = (t) => users.filter((u) => (u.account_type || 'subscriber') === t);

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            if (orderFilter.status !== 'all' && o.order_status !== orderFilter.status) return false;
            if (orderFilter.product !== 'all') {
                const items = orderItems[o.id] || [];
                if (!items.some((it) => it.product === orderFilter.product || it.product_name?.includes(orderFilter.product))) return false;
            }
            return true;
        });
    }, [orders, orderFilter, orderItems]);

    const lowStockProducts = useMemo(
        () => products.filter((p) => {
            const stock = Number(p.current_stock) || 0;
            const threshold = Number(p.low_stock_threshold) || 0;
            return p.format === 'hardcopy' && threshold > 0 && stock <= threshold;
        }),
        [products],
    );

    const preregStats = useMemo(() => {
        const byProduct = {};
        let totalCopies = 0;
        let totalRegistrations = 0;
        for (const r of bookPreregistrations) {
            if (r.status === 'cancelled') continue;
            const pid = typeof r.product === 'object' ? r.product?.id : r.product;
            const qty = Number(r.quantity) || 1;
            if (!byProduct[pid]) byProduct[pid] = { copies: 0, registrations: 0 };
            byProduct[pid].copies += qty;
            byProduct[pid].registrations += 1;
            totalCopies += qty;
            totalRegistrations += 1;
        }
        return { byProduct, totalCopies, totalRegistrations };
    }, [bookPreregistrations]);

    const pendingPrereg = bookPreregistrations.filter((r) => (r.status || 'pending') === 'pending').length;

    const approvalRow = (u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
                <p className="font-display text-lg">{u.name || u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {u.organisation || u.email} · {u.country || 'Country not set'} {u.territory ? `· ${u.territory}` : ''}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{u.approval_status || 'pending'}</span>
                <button type="button" onClick={() => setApproval(u.id, 'approved')} className={smallBtn}>Approve</button>
                <button type="button" onClick={() => setApproval(u.id, 'rejected')} className={dangerBtn}>Decline</button>
            </div>
        </li>
    );

    // Fail-closed: this component is only ever rendered for a known staff role
    // by its callers, but guard here too so an unrecognized role shows nothing.
    if (!authorized) {
        return (
            <DashboardShell
                title="Access restricted | King Dawie Publishing"
                description="This account is not authorized to view the administrator area."
                nav={[]}
            >
                {() => (
                    <EmptyState>
                        You do not have permission to view this administrator area. Please contact the platform operator.
                    </EmptyState>
                )}
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            title="Administrator dashboard | King Dawie Publishing"
            description="Inventory, sales, orders, stock tracking, employee access and platform administration for the Peter Edochie Legacy commerce system."
            nav={nav}
        >
            {(tab) => (
                <>
                    {error ? <p className="border border-[hsl(var(--destructive))]/40 px-6 py-4 text-sm text-[hsl(var(--destructive))]">{error}</p> : null}

                    {tab === 'analytics' ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Stat label="Accounts" value={users.length} />
                                <Stat label="Newsletter subscribers" value={subscribers.length} />
                                <Stat label="Published events" value={events.length} />
                                <Stat label="Pending approvals" value={users.filter((u) => u.approval_status === 'pending').length} />
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Stat label="Products" value={products.length} />
                                <Stat label="Orders" value={orders.length} />
                                <Stat label="Paid orders" value={orders.filter((o) => o.payment_status === 'paid').length} />
                                <Stat label="Low stock" value={lowStockProducts.length} hint="At or below threshold" />
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Stat label="Sponsorship applications" value={sponsorships.length} hint="All packages" />
                                <Stat label="Approved sponsors" value={sponsorships.filter((s) => s.status === 'approved').length} />
                                <Stat label="Sponsorship revenue" value={formatUSD(sponsorships.filter((s) => s.payment_status === 'paid').reduce((n, s) => n + (Number(s.investment_amount) || 0), 0))} hint="Paid investments" />
                                <Stat label="Countries" value={countries.length} hint="Active & upcoming" />
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Stat label="Copies pre-ordering" value={preregStats.totalCopies} hint={`${preregStats.totalRegistrations} registrations`} />
                                <Stat label="Mentorship applications" value={applications.length} hint={`${applications.filter((a) => (a.status || 'pending') === 'pending').length} pending`} />
                                <Stat label="Contact enquiries" value={enquiries.length} />
                                <Stat label="Newsletter subscribers" value={subscribers.length} />
                            </div>
                        </>
                    ) : null}

                    {tab === 'inventory' ? (
                        <Panel title="Inventory management" lead="Create and manage products, editions, pricing, availability and stock limits. Products only appear on the storefront when enabled.">
                            <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className={input} />
                                <input placeholder="Edition (e.g. Signed copy)" value={productForm.edition} onChange={(e) => setProductForm({ ...productForm, edition: e.target.value })} className={input} />
                                <select value={productForm.product_type} onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })} className={input}>
                                    {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={productForm.format} onChange={(e) => setProductForm({ ...productForm, format: e.target.value })} className={input}>
                                    {FORMATS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="number" step="0.01" placeholder="Price (USD)" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className={input} />
                                <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} className={input}>
                                    {STATUSES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="number" placeholder="Inventory limit" value={productForm.inventory_limit} onChange={(e) => setProductForm({ ...productForm, inventory_limit: e.target.value })} className={input} />
                                <input type="number" placeholder="Current stock" value={productForm.current_stock} onChange={(e) => setProductForm({ ...productForm, current_stock: e.target.value })} className={input} />
                                <input type="number" placeholder="Low-stock threshold" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })} className={input} />
                                <input placeholder="External URL (Amazon) — optional" value={productForm.external_url} onChange={(e) => setProductForm({ ...productForm, external_url: e.target.value })} className={input} />
                                <input placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} className={input} />
                                {productForm.product_type === 'book' ? (
                                    <>
                                        <select value={productForm.book_category} onChange={(e) => setProductForm({ ...productForm, book_category: e.target.value })} className={input}>
                                            <option value="">No category</option>
                                            {bookCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <input placeholder="Author" value={productForm.author} onChange={(e) => setProductForm({ ...productForm, author: e.target.value })} className={input} />
                                        <input placeholder="ISBN" value={productForm.isbn} onChange={(e) => setProductForm({ ...productForm, isbn: e.target.value })} className={input} />
                                        <input type="number" placeholder="Pages" value={productForm.pages} onChange={(e) => setProductForm({ ...productForm, pages: e.target.value })} className={input} />
                                        <input placeholder="Language" value={productForm.language} onChange={(e) => setProductForm({ ...productForm, language: e.target.value })} className={input} />
                                        <input placeholder="Published year" value={productForm.published_year} onChange={(e) => setProductForm({ ...productForm, published_year: e.target.value })} className={input} />
                                        <textarea placeholder="Excerpt" rows={3} value={productForm.excerpt} onChange={(e) => setProductForm({ ...productForm, excerpt: e.target.value })} className={`${input} md:col-span-2`} />
                                    </>
                                ) : null}
                                <input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className={`${input} md:col-span-2`} />
                                <div className="flex items-center gap-6 md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={productForm.enabled} onChange={(e) => setProductForm({ ...productForm, enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Enabled on storefront</label>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={productForm.main_order_enabled} onChange={(e) => setProductForm({ ...productForm, main_order_enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Main order available</label>
                                </div>
                                <div className="flex gap-3 md:col-span-2">
                                    <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">{editingId ? 'Update product' : 'Add product'}</button>
                                    {editingId ? <button type="button" onClick={() => { setEditingId(null); setProductForm(emptyProductForm); }} className={smallBtn}>Cancel</button> : null}
                                </div>
                            </form>

                            <ul className="mt-8 divide-y divide-border">
                                {products.length === 0 ? <EmptyState>No products yet.</EmptyState> : null}
                                {products.map((p) => (
                                    <li key={p.id} className="py-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="max-w-md">
                                                <p className="font-display text-lg">{p.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{p.edition} · {p.format} · {p.product_type} · {formatUSD(p.price)}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Stock: {p.current_stock ?? 0} / limit {p.inventory_limit ?? 0} · low-stock at {p.low_stock_threshold ?? 0}</p>
                                                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    {p.status} · {p.enabled ? 'storefront on' : 'storefront off'} · {p.main_order_enabled ? 'main order on' : 'main order off'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-start gap-4">
                                                {p.product_type === 'book' ? (
                                                    <ProductQrPanel product={p} compact />
                                                ) : null}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button type="button" onClick={() => quickToggle(p, 'enabled')} className={smallBtn}>{p.enabled ? 'Hide' : 'Show'}</button>
                                                    <button type="button" onClick={() => quickToggle(p, 'main_order_enabled')} className={smallBtn}>{p.main_order_enabled ? 'Disable main' : 'Enable main'}</button>
                                                    <button type="button" onClick={() => editProduct(p)} className={smallBtn}>Edit</button>
                                                    <button type="button" onClick={() => deleteProduct(p.id)} className={dangerBtn}>Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'orders' ? (
                        <Panel
                            title="Sales & orders"
                            lead="Every order across books, tickets and merchandise. Filter, update status, schedule delivery and track shipments."
                            actions={<button type="button" onClick={exportOrdersCSV} className={smallBtn}>Export CSV</button>}
                        >
                            <div className="mb-6 flex flex-wrap items-center gap-4">
                                <select value={orderFilter.status} onChange={(e) => setOrderFilter({ ...orderFilter, status: e.target.value })} className={input}>
                                    <option value="all">All statuses</option>
                                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={orderFilter.product} onChange={(e) => setOrderFilter({ ...orderFilter, product: e.target.value })} className={input}>
                                    <option value="all">All products</option>
                                    {products.map((p) => <option key={p.id} value={p.id}>{p.edition || p.name}</option>)}
                                </select>
                            </div>

                            {filteredOrders.length === 0 ? <EmptyState>No orders match this filter.</EmptyState> : (
                                <ul className="divide-y divide-border">
                                    {filteredOrders.map((o) => {
                                        const items = orderItems[o.id] || [];
                                        const addr = o.shipping_address || {};
                                        return (
                                            <li key={o.id} className="py-6">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="max-w-xl">
                                                        <p className="font-display text-lg">{o.items_summary || 'Order'}</p>
                                                        <p className="mt-1 font-mono text-xs text-muted-foreground">{o.payment_reference || o.id}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{o.email} · {fmtDate(o.created)}</p>
                                                        <p className="mt-2 text-sm text-[hsl(var(--gold))]">{formatUSD(o.total_price)} · payment {o.payment_status}</p>
                                                        {items.length > 0 ? (
                                                            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                                                {items.map((it) => <li key={it.id}>{it.product_name} × {it.quantity} — {formatUSD(it.total_price)}</li>)}
                                                            </ul>
                                                        ) : null}
                                                        {addr.address_line ? (
                                                            <p className="mt-3 text-xs text-muted-foreground">
                                                                Ship to: {addr.full_name || ''} {addr.address_line}, {addr.city} {addr.region || ''} {addr.country}
                                                            </p>
                                                        ) : null}
                                                        {o.tracking_number ? <p className="mt-2 text-xs text-muted-foreground">Tracking: {o.tracking_number}</p> : null}
                                                        {o.estimated_delivery ? <p className="mt-1 text-xs text-muted-foreground">Est. delivery: {fmtDate(o.estimated_delivery)}</p> : null}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <select value={o.order_status || 'pending'} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className={input}>
                                                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <input type="date" value={o.estimated_delivery ? o.estimated_delivery.slice(0, 10) : ''} onChange={(e) => updateOrderMeta(o.id, { estimated_delivery: e.target.value || null })} className={`${input} max-w-[10rem]`} title="Estimated delivery" />
                                                            <input placeholder="Tracking #" value={o.tracking_number || ''} onChange={(e) => updateOrderMeta(o.id, { tracking_number: e.target.value })} className={`${input} max-w-[10rem]`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'tracking' ? (
                        <>
                            <Panel title="Stock tracking" lead="Real-time stock levels, low-stock alerts and a manual stock adjustment tool.">
                                {lowStockProducts.length > 0 ? (
                                    <div className="mb-6 border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 px-5 py-4">
                                        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Low stock alert</p>
                                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                            {lowStockProducts.map((p) => <li key={p.id}>{p.name} — {p.current_stock} left (threshold {p.low_stock_threshold})</li>)}
                                        </ul>
                                    </div>
                                ) : null}

                                <form onSubmit={adjustStock} className="grid gap-4 md:grid-cols-3">
                                    <select value={adjustForm.product} onChange={(e) => setAdjustForm({ ...adjustForm, product: e.target.value })} className={input}>
                                        <option value="">Select product</option>
                                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Quantity change (+/-)" value={adjustForm.delta} onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })} className={input} />
                                    <input placeholder="Reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className={input} />
                                    <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white md:col-span-3">Apply stock adjustment</button>
                                </form>

                                <ul className="mt-8 divide-y divide-border">
                                    {products.length === 0 ? <EmptyState>No products tracked.</EmptyState> : null}
                                    {products.map((p) => {
                                        const stock = Number(p.current_stock) || 0;
                                        const threshold = Number(p.low_stock_threshold) || 0;
                                        const low = p.format === 'hardcopy' && threshold > 0 && stock <= threshold;
                                        return (
                                            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                                <div>
                                                    <p className="font-display text-lg">{p.name}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">{p.format} · limit {p.inventory_limit ?? 0}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-display text-2xl ${low ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--gold))]'}`}>{stock}</span>
                                                    {low ? <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Low</span> : null}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Panel>

                            <div className="mt-6">
                                <Panel title="Stock history" lead="Audit log of every stock movement.">
                                    {movements.length === 0 ? <EmptyState>No stock movements recorded yet.</EmptyState> : (
                                        <ul className="divide-y divide-border">
                                            {movements.slice(0, 50).map((m) => {
                                                const p = m.product;
                                                return (
                                                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
                                                        <span className="text-muted-foreground">{p?.name || m.product}</span>
                                                        <span className={Number(m.quantity_change) < 0 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--gold))]'}>
                                                            {Number(m.quantity_change) > 0 ? '+' : ''}{m.quantity_change} → {m.new_stock}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{m.reason}</span>
                                                        <span className="text-xs text-muted-foreground">{fmtDate(m.created)}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </Panel>
                            </div>
                        </>
                    ) : null}

                    {tab === 'employees' ? (
                        <Panel title="Employee access control" lead="Grant or revoke staff roles. Roles scope what each employee can do in this dashboard and are enforced server-side.">
                            <form onSubmit={assignEmployee} className="grid gap-4 md:grid-cols-3">
                                <select value={empForm.user} onChange={(e) => setEmpForm({ ...empForm, user: e.target.value })} className={input}>
                                    <option value="">Select user</option>
                                    {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                                </select>
                                <select value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} className={input}>
                                    {EMPLOYEE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">Grant role</button>
                            </form>

                            <ul className="mt-8 divide-y divide-border">
                                {employees.length === 0 ? <EmptyState>No employees assigned yet.</EmptyState> : null}
                                {employees.map((emp) => (
                                    <li key={emp.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                        <div>
                                            <p className="font-display text-lg">{emp.user?.name || emp.user?.email || 'Employee'}</p>
                                            <p className="mt-1 text-xs text-[hsl(var(--gold))]">{EMPLOYEE_ROLES.find((r) => r.value === emp.role)?.label || emp.role}</p>
                                        </div>
                                        <button type="button" onClick={() => revokeEmployee(emp)} className={dangerBtn}>Revoke</button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'events' ? (
                        <Panel title="Event management" lead="Create, publish and remove events. Ticketing follows each published event.">
                            <form onSubmit={createEvent} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className={input} />
                                <input placeholder="Category" value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} className={input} />
                                <select value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} className={input}>
                                    <option value="ghana_launch">Ghana Launch</option>
                                    <option value="masterclass">MasterClass</option>
                                    <option value="meet_and_greet">Meet & Greet</option>
                                </select>
                                <input placeholder="City" value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} className={input} />
                                <input placeholder="Venue" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} className={input} />
                                <input type="datetime-local" value={eventForm.starts} onChange={(e) => setEventForm({ ...eventForm, starts: e.target.value })} className={input} />
                                <input placeholder="Summary" value={eventForm.summary} onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })} className={input} />
                                <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white md:col-span-2">Publish event</button>
                            </form>
                            <ul className="mt-8 divide-y divide-border">
                                {events.length === 0 ? <EmptyState>No events published.</EmptyState> : null}
                                {events.map((e) => (
                                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                        <div>
                                            <p className="font-display text-lg">{e.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{e.venue} · {e.city}</p>
                                        </div>
                                        <button type="button" onClick={() => deleteEvent(e.id)} className={dangerBtn}>Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'users' ? (
                        <Panel title="User management" lead="Every account on the platform, with type and approval state.">
                            <ul className="divide-y divide-border">
                                {users.length === 0 ? <EmptyState>No accounts loaded.</EmptyState> : null}
                                {users.map((u) => (
                                    <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                        <div>
                                            <p className="font-display text-lg">{u.name || u.email}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{u.email} · {u.verified ? 'Verified' : 'Unverified'}</p>
                                        </div>
                                        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">{ACCOUNT_LABEL[u.account_type || 'subscriber']}</span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'distributors' ? (
                        <Panel title="Distributor management" lead="Approve applications, assign territories and manage trade pricing.">
                            <ul className="divide-y divide-border">
                                {byType('distributor').length === 0 ? <EmptyState>No distributor applications.</EmptyState> : null}
                                {byType('distributor').map((u) => (
                                    <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                                        <div className="max-w-md">
                                            <p className="font-display text-lg">{u.name || u.email}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {u.organisation || u.email} · {u.country || 'Country not set'} · {u.phone || 'No phone'}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                                                    Territory: {u.territory || 'Unassigned'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Assign territory (e.g. Ghana)"
                                                defaultValue={u.territory || ''}
                                                id={`territory-${u.id}`}
                                                className="border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-[hsl(var(--gold))]"
                                            />
                                            <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{u.approval_status || 'pending'}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const territoryVal = document.getElementById(`territory-${u.id}`)?.value || u.territory;
                                                    setApproval(u.id, 'approved', { territory: territoryVal });
                                                }}
                                                className={smallBtn}
                                            >
                                                Approve
                                            </button>
                                            <button type="button" onClick={() => setApproval(u.id, 'rejected')} className={dangerBtn}>Decline</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'sponsors' ? (
                        <Panel title="Sponsor management" lead="Approve partners and manage sponsorship packages.">
                            <ul className="divide-y divide-border">
                                {byType('sponsor').length === 0 ? <EmptyState>No sponsor applications.</EmptyState> : null}
                                {byType('sponsor').map(approvalRow)}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'mentorship' ? (
                        <>
                        <Panel title="Mentorship applications" lead="Every field submitted on the public mentorship application form — name, email, country, discipline, registration type, cohort and personal statement.">
                            <ul className="divide-y divide-border">
                                {applications.length === 0 ? <EmptyState>No applications submitted.</EmptyState> : null}
                                {applications.map((a) => (
                                    <MentorshipApplicationRow
                                        key={a.id}
                                        application={a}
                                        input={input}
                                        smallBtn={smallBtn}
                                        dangerBtn={dangerBtn}
                                        onAccept={(id, type) => setMentorshipStatus(id, 'accepted', type)}
                                        onReject={(id) => setMentorshipStatus(id, 'rejected')}
                                        onRegistrationTypeChange={setMentorshipRegistrationType}
                                    />
                                ))}
                            </ul>
                        </Panel>
                        <Panel title="Programme materials" lead="Publish resources and set the minimum registration type required to unlock each item.">
                            <form onSubmit={createMaterial} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Title" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} className={input} />
                                <input placeholder="Module (e.g. Craft)" value={materialForm.module} onChange={(e) => setMaterialForm({ ...materialForm, module: e.target.value })} className={input} />
                                <input placeholder="Cohort" value={materialForm.cohort} onChange={(e) => setMaterialForm({ ...materialForm, cohort: e.target.value })} className={input} />
                                <select value={materialForm.registration_type} onChange={(e) => setMaterialForm({ ...materialForm, registration_type: e.target.value })} className={input}>
                                    {REGISTRATION_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label} tier</option>
                                    ))}
                                </select>
                                <input placeholder="Sort order" value={materialForm.sort} onChange={(e) => setMaterialForm({ ...materialForm, sort: e.target.value })} className={input} />
                                <input placeholder="External URL" value={materialForm.url} onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })} className={input} />
                                <input placeholder="Video URL" value={materialForm.video_url} onChange={(e) => setMaterialForm({ ...materialForm, video_url: e.target.value })} className={`${input} md:col-span-2`} />
                                <textarea placeholder="Description" value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} className={`${input} md:col-span-2`} rows={3} />
                                <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                                    <input type="checkbox" checked={materialForm.published} onChange={(e) => setMaterialForm({ ...materialForm, published: e.target.checked })} />
                                    Published
                                </label>
                                <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white md:col-span-2">Add material</button>
                            </form>
                            <ul className="mt-8 divide-y divide-border">
                                {materials.length === 0 ? <EmptyState>No materials yet.</EmptyState> : null}
                                {materials.map((m) => (
                                    <li key={m.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                                        <div>
                                            <p className="font-display text-lg">{m.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {m.module || 'General'} · {m.cohort || 'All cohorts'} · {registrationTypeLabel(m.registration_type)} · {m.published ? 'Published' : 'Draft'}
                                            </p>
                                            {m.description ? <p className="mt-2 text-sm text-muted-foreground">{m.description}</p> : null}
                                        </div>
                                        <button type="button" onClick={() => deleteMaterial(m.id)} className={dangerBtn}>Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                        </>
                    ) : null}

                    {tab === 'books' ? (
                        <>
                        <Panel title="Book categories" lead="Organise the book catalogue into categories shown on the public book page.">
                            <form onSubmit={saveCategory} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={input} />
                                <input placeholder="Slug (auto-generated if empty)" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} className={input} />
                                <input type="number" placeholder="Sort order" value={categoryForm.sort} onChange={(e) => setCategoryForm({ ...categoryForm, sort: e.target.value })} className={input} />
                                <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={categoryForm.enabled} onChange={(e) => setCategoryForm({ ...categoryForm, enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Enabled on storefront</label>
                                <textarea placeholder="Category description" rows={3} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className={`${input} md:col-span-2`} />
                                <div className="flex flex-wrap gap-3 md:col-span-2">
                                    <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">{editingCategoryId ? 'Update category' : 'Add category'}</button>
                                    {editingCategoryId ? <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategoryForm); }} className={smallBtn}>Cancel</button> : null}
                                </div>
                            </form>
                            <ul className="mt-8 divide-y divide-border">
                                {bookCategories.length === 0 ? <EmptyState>No categories yet.</EmptyState> : bookCategories.map((c) => (
                                    <li key={c.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                                        <div>
                                            <p className="font-display text-lg">{c.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{c.slug} · sort {c.sort ?? 0} · {c.enabled ? 'Enabled' : 'Hidden'}</p>
                                            {c.description ? <p className="mt-2 text-sm text-muted-foreground">{c.description}</p> : null}
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => editCategory(c)} className={smallBtn}>Edit</button>
                                            <button type="button" onClick={() => deleteCategory(c.id)} className={dangerBtn}>Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Panel>

                        <Panel title="Books & editions" lead="Manage book details, pricing, stock and category assignment.">
                            <form onSubmit={saveBook} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Book title" value={bookForm.name} onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })} className={input} />
                                <input placeholder="Edition label (e.g. Signed copy)" value={bookForm.edition} onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })} className={input} />
                                <select required value={bookForm.book_category} onChange={(e) => setBookForm({ ...bookForm, book_category: e.target.value })} className={input}>
                                    <option value="">Select category</option>
                                    {bookCategories.filter((c) => c.enabled !== false).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className={input} />
                                <input placeholder="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} className={input} />
                                <input type="number" placeholder="Pages" value={bookForm.pages} onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })} className={input} />
                                <input placeholder="Language" value={bookForm.language} onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })} className={input} />
                                <input placeholder="Published year" value={bookForm.published_year} onChange={(e) => setBookForm({ ...bookForm, published_year: e.target.value })} className={input} />
                                <select value={bookForm.format} onChange={(e) => setBookForm({ ...bookForm, format: e.target.value })} className={input}>
                                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <select value={bookForm.status} onChange={(e) => setBookForm({ ...bookForm, status: e.target.value })} className={input}>
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <input type="number" step="0.01" placeholder="Price (USD)" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} className={input} />
                                <input type="number" placeholder="Inventory limit" value={bookForm.inventory_limit} onChange={(e) => setBookForm({ ...bookForm, inventory_limit: e.target.value })} className={input} />
                                <input type="number" placeholder="Current stock" value={bookForm.current_stock} onChange={(e) => setBookForm({ ...bookForm, current_stock: e.target.value })} className={input} />
                                <input placeholder="Image URL" value={bookForm.image} onChange={(e) => setBookForm({ ...bookForm, image: e.target.value })} className={input} />
                                <input placeholder="External URL (Amazon)" value={bookForm.external_url} onChange={(e) => setBookForm({ ...bookForm, external_url: e.target.value })} className={input} />
                                <textarea placeholder="Full description" rows={4} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} className={`${input} md:col-span-2`} />
                                <textarea placeholder="Excerpt / sample text" rows={3} value={bookForm.excerpt} onChange={(e) => setBookForm({ ...bookForm, excerpt: e.target.value })} className={`${input} md:col-span-2`} />
                                <div className="flex flex-wrap gap-6 md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={bookForm.enabled} onChange={(e) => setBookForm({ ...bookForm, enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Enabled on storefront</label>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={bookForm.main_order_enabled} onChange={(e) => setBookForm({ ...bookForm, main_order_enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Main order available</label>
                                </div>
                                <div className="flex flex-wrap gap-3 md:col-span-2">
                                    <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">{editingBookId ? 'Update book' : 'Add book'}</button>
                                    {editingBookId ? <button type="button" onClick={() => { setEditingBookId(null); setBookForm(emptyBookForm); }} className={smallBtn}>Cancel</button> : null}
                                </div>
                            </form>

                            {bookCategories.map((cat) => {
                                const catBooks = products.filter((p) => p.product_type === 'book' && (p.book_category === cat.id || p.expand?.book_category?.id === cat.id));
                                if (catBooks.length === 0) return null;
                                return (
                                    <div key={cat.id} className="mt-10 border-t border-border pt-8">
                                        <p className="eyebrow">{cat.name}</p>
                                        <ul className="mt-4 divide-y divide-border">
                                            {catBooks.map((p) => (
                                                <li key={p.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                                    <div className="max-w-2xl">
                                                        <p className="font-display text-xl">{p.edition || p.name}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {p.author || '—'} · {p.isbn || 'No ISBN'} · {p.format} · {formatUSD(p.price)} · {p.enabled ? 'Live' : 'Hidden'}
                                                        </p>
                                                        <p className="mt-2 text-xs text-[hsl(var(--gold))]">
                                                            {preregStats.byProduct[p.id]
                                                                ? `${preregStats.byProduct[p.id].copies} copies pre-ordering · ${preregStats.byProduct[p.id].registrations} registration${preregStats.byProduct[p.id].registrations === 1 ? '' : 's'}`
                                                                : 'No pre-orders yet'}
                                                        </p>
                                                        {p.excerpt ? <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p> : null}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => editBook(p)} className={smallBtn}>Edit</button>
                                                        <button type="button" onClick={() => deleteBook(p.id)} className={dangerBtn}>Delete</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                            {products.filter((p) => p.product_type === 'book' && !p.book_category && !p.expand?.book_category?.id).length > 0 ? (
                                <div className="mt-10 border-t border-border pt-8">
                                    <p className="eyebrow">Uncategorised</p>
                                    <ul className="mt-4 divide-y divide-border">
                                        {products.filter((p) => p.product_type === 'book' && !p.book_category && !p.expand?.book_category?.id).map((p) => (
                                            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                                                <p className="font-display text-xl">{p.edition || p.name}</p>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => editBook(p)} className={smallBtn}>Edit</button>
                                                    <button type="button" onClick={() => deleteBook(p.id)} className={dangerBtn}>Delete</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </Panel>

                        <Panel title="Pre-registrations" lead="Interest captured from the public book detail pages. Follow up when ordering opens.">
                            <div className="mb-8 grid gap-4 sm:grid-cols-2">
                                <Stat label="Total copies pre-ordering" value={preregStats.totalCopies} />
                                <Stat label="Registrations" value={preregStats.totalRegistrations} />
                            </div>
                            {bookPreregistrations.length === 0 ? (
                                <EmptyState>No pre-registrations yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {bookPreregistrations.map((r) => (
                                        <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                            <div>
                                                <p className="font-display text-lg">{r.full_name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{r.email} · {r.phone || 'No phone'} · {r.city || '—'}, {r.country || '—'}</p>
                                                <p className="mt-2 text-sm text-[hsl(var(--gold))]">{r.edition || r.product?.edition || r.expand?.product?.edition || r.product_name}</p>
                                                <p className="mt-1 text-xs font-medium text-foreground">{Number(r.quantity) || 1} {(Number(r.quantity) || 1) === 1 ? 'copy' : 'copies'}</p>
                                                {r.notes ? <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p> : null}
                                                <p className="mt-2 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{fmtDate(r.created)}</p>
                                            </div>
                                            <select value={r.status || 'pending'} onChange={(e) => updatePreregStatus(r.id, e.target.value)} className={`${input} max-w-[10rem]`}>
                                                <option value="pending">Pending</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Book QR codes" lead="Generate scan-to-order QR codes for each book edition.">
                            {products.filter((p) => p.product_type === 'book').length === 0 ? (
                                <EmptyState>No book editions yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {products.filter((p) => p.product_type === 'book').map((p) => (
                                        <li key={p.id} className="flex flex-wrap items-start justify-between gap-6 py-6">
                                            <div>
                                                <p className="font-display text-xl">{p.edition || p.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {p.book_category?.name || p.expand?.book_category?.name || bookCategories.find((c) => c.id === (p.book_category?.id || p.book_category))?.name || 'Uncategorised'} · {p.format} · {formatUSD(p.price)}
                                                    {preregStats.byProduct[p.id] ? ` · ${preregStats.byProduct[p.id].copies} copies pre-ordering` : ''}
                                                </p>
                                            </div>
                                            <ProductQrPanel product={p} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                        </>
                    ) : null}

                    {tab === 'cms' ? (
                        <Panel title="Content management" lead="Publish journal entries; gallery, mentorship and page content follow the same workflow.">
                            <form onSubmit={createNews} className="grid gap-4 md:grid-cols-2">
                                <input required placeholder="Title" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} className={input} />
                                <input placeholder="Category" value={newsForm.category} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })} className={input} />
                                <input placeholder="Excerpt" value={newsForm.excerpt} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })} className={`${input} md:col-span-2`} />
                                <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white md:col-span-2">Publish entry</button>
                            </form>
                            <ul className="mt-8 divide-y divide-border">
                                {news.map((n) => (
                                    <li key={n.id} className="py-4">
                                        <p className="font-display text-lg">{n.title}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{n.excerpt}</p>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'payments' ? (
                        <Panel title="Payments & reconciliation" lead="Paystack transactions reconcile automatically. Add your Paystack secret key in the API server env to enable live payments.">
                            <EmptyState>Payment reconciliation appears here once Paystack is connected and orders are paid.</EmptyState>
                        </Panel>
                    ) : null}

                    {tab === 'sponsorships' ? (
                        <Panel title="Sponsorship applications" lead="Review corporate sponsorship applications, approve or reject, and track sponsorship payments.">
                            {sponsorships.length === 0 ? <EmptyState>No sponsorship applications yet.</EmptyState> : (
                                <ul className="divide-y divide-border">
                                    {sponsorships.map((s) => {
                                        const pkg = s.package;
                                        return (
                                            <li key={s.id} className="py-6">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="max-w-xl">
                                                        <p className="font-display text-lg">{s.company_name}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{s.contact_person} · {s.email} · {s.country || 'Country not set'}</p>
                                                        <p className="mt-2 text-sm text-[hsl(var(--gold))]">
                                                            {pkg?.name || s.package_tier || 'Package'} · {formatUSD(s.investment_amount || pkg?.price)} · {pkg?.duration || '12 months'}
                                                        </p>
                                                        {s.message ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.message}</p> : null}
                                                        {s.website ? <p className="mt-2 text-xs text-muted-foreground">{s.website}</p> : null}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => setSponsorshipStatus(s.id, 'approved')} className={smallBtn}>Approve</button>
                                                            <button type="button" onClick={() => setSponsorshipStatus(s.id, 'rejected')} className={dangerBtn}>Reject</button>
                                                        </div>
                                                        <select value={s.payment_status || 'unpaid'} onChange={(e) => setSponsorshipPayment(s.id, e.target.value)} className={`${input} max-w-[10rem]`}>
                                                            <option value="unpaid">Unpaid</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="refunded">Refunded</option>
                                                        </select>
                                                        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{s.status || 'pending'}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'packages' ? (
                        <>
                            <Panel title="Sponsorship packages" lead="Pricing tiers shown to sponsors on the public sponsorship page. Each package maps to a tier that appears on applications.">
                                <form onSubmit={saveSponsorPkg} className="grid gap-4 md:grid-cols-2">
                                    <input required placeholder="Package name" value={sponsorPkgForm.name} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, name: e.target.value })} className={input} />
                                    <input required placeholder="Tier key (e.g. gold)" value={sponsorPkgForm.tier} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, tier: e.target.value })} className={input} />
                                    <input type="number" step="0.01" required placeholder="Price" value={sponsorPkgForm.price} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, price: e.target.value })} className={input} />
                                    <input placeholder="Currency (e.g. USD)" value={sponsorPkgForm.currency} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, currency: e.target.value })} className={input} />
                                    <input placeholder="Duration (e.g. 12 months)" value={sponsorPkgForm.duration} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, duration: e.target.value })} className={input} />
                                    <input placeholder="Sort order" value={sponsorPkgForm.sort} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, sort: e.target.value })} className={input} />
                                    <input placeholder="Image URL" value={sponsorPkgForm.image} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, image: e.target.value })} className={input} />
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <input type="checkbox" checked={sponsorPkgForm.enabled} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                                        Enabled
                                    </label>
                                    <input placeholder="Description" value={sponsorPkgForm.description} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, description: e.target.value })} className={`${input} md:col-span-2`} />
                                    <textarea placeholder="Benefits (one per line)" rows={3} value={sponsorPkgForm.benefits} onChange={(e) => setSponsorPkgForm({ ...sponsorPkgForm, benefits: e.target.value })} className={`${input} md:col-span-2`} />
                                    <div className="flex gap-3 md:col-span-2">
                                        <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">{editingSponsorPkgId ? 'Update package' : 'Add package'}</button>
                                        {editingSponsorPkgId ? <button type="button" onClick={() => { setEditingSponsorPkgId(null); resetSponsorPkgForm(); }} className={smallBtn}>Cancel</button> : null}
                                    </div>
                                </form>
                                <ul className="mt-8 divide-y divide-border">
                                    {sponsorPackages.length === 0 ? <EmptyState>No sponsorship packages yet.</EmptyState> : null}
                                    {sponsorPackages.map((p) => (
                                        <li key={p.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                            <div className="max-w-md">
                                                <p className="font-display text-lg">{p.name} <span className="text-xs text-muted-foreground">({p.tier})</span></p>
                                                <p className="mt-1 text-xs text-muted-foreground">{formatUSD(p.price)} {p.currency} · {p.duration || '—'} · {p.enabled ? 'Enabled' : 'Disabled'}</p>
                                                {Array.isArray(p.benefits) && p.benefits.length ? (
                                                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">{p.benefits.map((b, i) => <li key={i}>• {b}</li>)}</ul>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button type="button" onClick={() => toggleSponsorPkg(p)} className={smallBtn}>{p.enabled ? 'Disable' : 'Enable'}</button>
                                                <button type="button" onClick={() => editSponsorPkg(p)} className={smallBtn}>Edit</button>
                                                <button type="button" onClick={() => deleteSponsorPkg(p.id)} className={dangerBtn}>Delete</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>

                            <Panel title="Distributor pricing tiers" lead="Trade pricing bands offered to approved distributors. The discount is taken off each product's retail price during a bulk order.">
                                <form onSubmit={saveTier} className="grid gap-4 md:grid-cols-4">
                                    <input required placeholder="Tier name" value={tierForm.name} onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })} className={`${input} md:col-span-2`} />
                                    <input type="number" placeholder="Min units" value={tierForm.min_units} onChange={(e) => setTierForm({ ...tierForm, min_units: e.target.value })} className={input} />
                                    <input type="number" placeholder="Max units (blank = open)" value={tierForm.max_units} onChange={(e) => setTierForm({ ...tierForm, max_units: e.target.value })} className={input} />
                                    <input type="number" step="0.01" required placeholder="Discount %" value={tierForm.discount} onChange={(e) => setTierForm({ ...tierForm, discount: e.target.value })} className={input} />
                                    <input placeholder="Terms" value={tierForm.terms} onChange={(e) => setTierForm({ ...tierForm, terms: e.target.value })} className={`${input} md:col-span-2`} />
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <input type="checkbox" checked={tierForm.enabled} onChange={(e) => setTierForm({ ...tierForm, enabled: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                                        Enabled
                                    </label>
                                    <div className="flex gap-3 md:col-span-4">
                                        <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">{editingTierId ? 'Update tier' : 'Add tier'}</button>
                                        {editingTierId ? <button type="button" onClick={() => { setEditingTierId(null); resetTierForm(); }} className={smallBtn}>Cancel</button> : null}
                                    </div>
                                </form>
                                <ul className="mt-8 divide-y divide-border">
                                    {distTiers.length === 0 ? <EmptyState>No distributor tiers yet.</EmptyState> : null}
                                    {distTiers.map((t) => (
                                        <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                            <div>
                                                <p className="font-display text-lg">{t.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {t.discount}% off retail · {t.min_units ?? 0}{t.max_units ? ` – ${t.max_units} units` : '+ units'} · {t.terms || '—'} · {t.enabled ? 'Enabled' : 'Disabled'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button type="button" onClick={() => toggleTier(t)} className={smallBtn}>{t.enabled ? 'Disable' : 'Enable'}</button>
                                                <button type="button" onClick={() => editTier(t)} className={smallBtn}>Edit</button>
                                                <button type="button" onClick={() => deleteTier(t.id)} className={dangerBtn}>Delete</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>

                            <Panel title="Event ticket pricing" lead="Set the base ticket price and manage PSS Meet & Greet ticket tiers for each event. Ticket tiers are used by the Paystack checkout.">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Event</label>
                                        <select value={ticketEventId} onChange={(e) => setTicketEventId(e.target.value)} className={input}>
                                            <option value="">Select an event</option>
                                            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Base ticket price (USD)</label>
                                        <input type="number" step="0.01" value={selectedTicketEvent?.price ?? ''} onChange={(e) => updateTicketEventPrice(ticketEventId, e.target.value)} className={input} placeholder="e.g. 500" />
                                    </div>
                                </div>

                                {ticketEventId ? (
                                    <>
                                        <div className="mt-6 border border-border">
                                            <p className="px-5 py-3 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Ticket tiers</p>
                                            {ticketTiers.length === 0 ? (
                                                <p className="px-5 pb-5 text-sm text-muted-foreground">No tiers yet. Add one below.</p>
                                            ) : (
                                                <ul className="divide-y divide-border">
                                                    {ticketTiers.map((tt, i) => (
                                                        <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
                                                            <p className="text-sm">{tt.name} <span className="text-muted-foreground">({tt.key})</span></p>
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-sm text-[hsl(var(--gold))]">{formatUSD(tt.price)}</p>
                                                                <button type="button" onClick={() => removeTicketTier(i)} className={smallBtn}>Remove</button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <form onSubmit={addTicketTier} className="mt-4 grid gap-4 md:grid-cols-4">
                                            <input required placeholder="Tier name (e.g. VIP)" value={ticketTierForm.name} onChange={(e) => setTicketTierForm({ ...ticketTierForm, name: e.target.value })} className={input} />
                                            <input placeholder="Key (auto if blank)" value={ticketTierForm.key} onChange={(e) => setTicketTierForm({ ...ticketTierForm, key: e.target.value })} className={input} />
                                            <input type="number" step="0.01" required placeholder="Price" value={ticketTierForm.price} onChange={(e) => setTicketTierForm({ ...ticketTierForm, price: e.target.value })} className={input} />
                                            <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">Add tier</button>
                                        </form>
                                    </>
                                ) : null}
                            </Panel>
                        </>
                    ) : null}

                    {tab === 'countries' ? (
                        <>
                            <Panel title="Countries & regions" lead="Manage the countries the platform operates in, their launch status and regional coordinators. Regions are seeded per country.">                                <form onSubmit={createCountry} className="grid gap-4 md:grid-cols-3">
                                    <input required placeholder="Country name" value={countryForm.name} onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })} className={input} />
                                    <input required placeholder="Code (e.g. KE)" value={countryForm.code} onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value })} className={input} />
                                    <input placeholder="Currency (e.g. KES)" value={countryForm.currency} onChange={(e) => setCountryForm({ ...countryForm, currency: e.target.value })} className={input} />
                                    <select value={countryForm.status} onChange={(e) => setCountryForm({ ...countryForm, status: e.target.value })} className={input}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="coming_soon">Coming soon</option>
                                    </select>
                                    <input type="date" value={countryForm.launch_date} onChange={(e) => setCountryForm({ ...countryForm, launch_date: e.target.value })} className={input} title="Launch date" />
                                    <select value={countryForm.regional_coordinator} onChange={(e) => setCountryForm({ ...countryForm, regional_coordinator: e.target.value })} className={input}>
                                        <option value="">No coordinator</option>
                                        {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                                    </select>
                                    <select value={countryForm.primary_distributor} onChange={(e) => setCountryForm({ ...countryForm, primary_distributor: e.target.value })} className={input}>
                                        <option value="">No primary distributor</option>
                                        {users.filter((u) => u.account_type === 'distributor' && u.approval_status === 'approved').map((u) => (
                                            <option key={u.id} value={u.id}>{u.organisation || u.name || u.email}</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white md:col-span-3">Add country</button>
                                </form>

                                <ul className="mt-8 divide-y divide-border">
                                    {countries.length === 0 ? <EmptyState>No countries configured.</EmptyState> : null}
                                    {countries.map((c) => {
                                        const countryRegions = regions.filter((r) => r.country?.id === c.id);
                                        const coord = c.regional_coordinator;
                                        const dist = c.primary_distributor;
                                        return (
                                            <li key={c.id} className="py-5">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-display text-xl">{c.name} <span className="font-mono text-xs text-muted-foreground">({c.code})</span></p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Currency: {c.currency || '—'} · {countryRegions.length} regions · Coordinator: {coord?.name || coord?.email || 'Unassigned'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Primary distributor: {dist?.organisation || dist?.name || dist?.email || 'Unassigned'}
                                                        </p>
                                                        {c.launch_date ? <p className="mt-1 text-xs text-muted-foreground">Launch: {fmtDate(c.launch_date)}</p> : null}
                                                        {countryRegions.length > 0 ? (
                                                            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">{countryRegions.map((r) => r.name).join(' · ')}</p>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <select value={c.status || 'active'} onChange={(e) => updateCountryStatus(c.id, e.target.value)} className={`${input} max-w-[10rem]`}>
                                                            <option value="active">Active</option>
                                                            <option value="inactive">Inactive</option>
                                                            <option value="coming_soon">Coming soon</option>
                                                        </select>
                                                        <select value={c.regional_coordinator?.id || ''} onChange={(e) => assignCoordinator(c.id, e.target.value)} className={`${input} max-w-[14rem]`}>
                                                            <option value="">No coordinator</option>
                                                            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                                                        </select>
                                                        <select value={c.primary_distributor?.id || ''} onChange={(e) => assignPrimaryDistributor(c.id, e.target.value)} className={`${input} max-w-[14rem]`}>
                                                            <option value="">No distributor</option>
                                                            {users.filter((u) => u.account_type === 'distributor' && u.approval_status === 'approved').map((u) => (
                                                                <option key={u.id} value={u.id}>{u.organisation || u.name || u.email}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Panel>
                        </>
                    ) : null}

                    {tab === 'newsletter' ? (
                        <NewsletterBroadcastPanel
                            subscribers={subscribers}
                            countries={countries}
                            onRefreshSubscribers={load}
                        />
                    ) : null}

                    {tab === 'reports' ? (
                        <Panel title="Reports & exports" lead="Export account, subscriber, order and event data.">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Stat label="Accounts" value={users.length} />
                                <Stat label="Subscribers" value={subscribers.length} />
                                <Stat label="Journal entries" value={news.length} />
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <Stat label="Products" value={products.length} />
                                <Stat label="Orders" value={orders.length} />
                                <Stat label="Paid orders" value={orders.filter((o) => o.payment_status === 'paid').length} />
                            </div>
                        </Panel>
                    ) : null}
                </>
            )}
        </DashboardShell>
    );
};

export default AdminDashboard;
