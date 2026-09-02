import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, CreditCard, FileText, Gauge, Globe, Handshake, Landmark, Package, ShoppingCart, TrendingDown, Truck, Users, GraduationCap, UserCog } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import { ACCOUNT_LABEL } from '@/lib/accounts';
import { formatUSD } from '@/lib/commerce';
import { REGISTRATION_TYPES, registrationTypeLabel } from '@/lib/mentorship';
import ProductQrPanel from '@/components/ProductQrPanel';
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
    { key: 'orders', label: 'Sales & Orders', icon: ShoppingCart },
    { key: 'tracking', label: 'Stock Tracking', icon: TrendingDown },
    { key: 'employees', label: 'Employees', icon: UserCog },
    { key: 'countries', label: 'Countries', icon: Globe },
    { key: 'cms', label: 'CMS', icon: FileText },
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

const input = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-[hsl(var(--gold))]';
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
};

const AdminDashboard = ({ role = 'super_admin' }) => {
    const allowedTabs = ROLE_TABS[role];
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
    const [orders, setOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [error, setError] = useState('');
    const [eventForm, setEventForm] = useState({ title: '', city: '', venue: '', starts: '', summary: '', category: '', event_type: 'masterclass' });
    const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', category: '' });
    const [productForm, setProductForm] = useState(emptyProductForm);
    const [editingId, setEditingId] = useState(null);
    const [orderFilter, setOrderFilter] = useState({ status: 'all', product: 'all' });
    const [empForm, setEmpForm] = useState({ user: '', role: 'inventory_manager' });
    const [adjustForm, setAdjustForm] = useState({ product: '', delta: '', reason: '' });
    const [countryForm, setCountryForm] = useState({ name: '', code: '', currency: '', status: 'coming_soon', launch_date: '', regional_coordinator: '', primary_distributor: '' });
    const [materialForm, setMaterialForm] = useState({
        title: '', description: '', module: '', cohort: '2027', registration_type: 'standard', sort: '', url: '', video_url: '', published: true,
    });

    const load = useCallback(async () => {
        try {
            const fetchers = {
                users: () => apiCrud.list('users', { sort: '-created' }),
                events: () => apiCrud.list('events', { sort: 'starts' }),
                news: () => apiCrud.list('news', { sort: '-created' }),
                products: () => apiCrud.list('products', { sort: '-created' }),
                orders: () => apiCrud.list('orders', { sort: '-created' }),
                movements: () => apiCrud.list('stock-movements', { sort: '-created' }).catch(() => []),
                employees: () => apiCrud.list('employee-roles', { sort: '-created' }).catch(() => []),
                subscribers: () => apiCrud.list('subscribers', { sort: '-created' }).catch(() => []),
                applications: () => apiCrud.list('mentorship-applications', { sort: '-created' }).catch(() => []),
                materials: () => apiCrud.list('mentorship-materials', { sort: 'sort,title' }).catch(() => []),
                sponsorships: () => apiCrud.list('sponsorships', { sort: '-created' }).catch(() => []),
                countries: () => apiCrud.list('countries', { sort: 'name' }).catch(() => []),
                regions: () => apiCrud.list('regions', { sort: 'name' }).catch(() => []),
            };
            const keys = Object.keys(fetchers);
            const results = await Promise.all(keys.map((k) => fetchers[k]()));
            const map = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
            setUsers(map.users);
            setEvents(map.events);
            setNews(map.news);
            setProducts(map.products);
            setOrders(map.orders);
            setMovements(map.movements);
            setEmployees(map.employees);
            setSubscribers(map.subscribers);
            setApplications(map.applications);
            setMaterials(map.materials);
            setSponsorships(map.sponsorships);
            setCountries(map.countries);
            setRegions(map.regions);
        } catch (_) {
            setError('Some administration data could not be loaded.');
        }
    }, []);

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

    const setApproval = async (id, status) => {
        try { await apiCrud.update('users', id, { approval_status: status }); load(); }
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

    const saveProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...productForm,
                price: productForm.price === '' ? 0 : Number(productForm.price),
                inventory_limit: productForm.inventory_limit === '' ? 0 : Number(productForm.inventory_limit),
                current_stock: productForm.current_stock === '' ? 0 : Number(productForm.current_stock),
                low_stock_threshold: productForm.low_stock_threshold === '' ? 0 : Number(productForm.low_stock_threshold),
                external_url: productForm.external_url || '',
                image: productForm.image || '',
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

    return (
        <DashboardShell
            title="Administrator dashboard | King Dawie Publishing"
            description="Inventory, sales, orders, stock tracking, employee access and platform administration for the Pete Edochie Legacy commerce system."
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
                                {byType('distributor').map(approvalRow)}
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
                        <Panel title="Mentorship applications" lead="Review applications, assign registration type on acceptance, and manage programme materials.">
                            <ul className="divide-y divide-border">
                                {applications.length === 0 ? <EmptyState>No applications submitted.</EmptyState> : null}
                                {applications.map((a) => (
                                    <li key={a.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                        <div className="max-w-xl">
                                            <p className="font-display text-lg">{a.name || a.email}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {a.email} · {a.country || 'Country not set'} · {a.discipline || 'Discipline not set'} · {a.cohort || '2027'} cohort
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Requested: {registrationTypeLabel(a.requested_type || 'standard')}
                                                {a.registration_type ? ` · Assigned: ${registrationTypeLabel(a.registration_type)}` : ''}
                                            </p>
                                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.statement}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{a.status || 'pending'}</span>
                                            {a.status === 'accepted' ? (
                                                <select
                                                    value={a.registration_type || a.requested_type || 'standard'}
                                                    onChange={(e) => setMentorshipRegistrationType(a.id, e.target.value)}
                                                    className={`${input} max-w-[12rem]`}
                                                >
                                                    {REGISTRATION_TYPES.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <select
                                                    id={`accept-type-${a.id}`}
                                                    defaultValue={a.registration_type || a.requested_type || 'standard'}
                                                    className={`${input} max-w-[12rem]`}
                                                >
                                                    {REGISTRATION_TYPES.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const sel = document.getElementById(`accept-type-${a.id}`);
                                                        setMentorshipStatus(a.id, 'accepted', sel?.value);
                                                    }}
                                                    className={smallBtn}
                                                    disabled={a.status === 'accepted'}
                                                >
                                                    Accept
                                                </button>
                                                <button type="button" onClick={() => setMentorshipStatus(a.id, 'rejected')} className={dangerBtn}>Reject</button>
                                            </div>
                                        </div>
                                    </li>
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
                        <Panel title="Book QR codes" lead="Generate scan-to-order QR codes for each book edition. Display these at events, on printed materials or in-store — scanning opens the edition order page.">
                            {products.filter((p) => p.product_type === 'book').length === 0 ? (
                                <EmptyState>No book editions yet. Add books under Inventory.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {products.filter((p) => p.product_type === 'book').map((p) => (
                                        <li key={p.id} className="flex flex-wrap items-start justify-between gap-6 py-6">
                                            <div>
                                                <p className="font-display text-xl">{p.edition || p.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{p.format} · {formatUSD(p.price)} · {p.enabled ? 'On storefront' : 'Hidden'}</p>
                                            </div>
                                            <ProductQrPanel product={p} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
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

                    {tab === 'countries' ? (
                        <>
                            <Panel title="Countries & regions" lead="Manage the countries the platform operates in, their launch status and regional coordinators. Regions are seeded per country.">
                                <form onSubmit={createCountry} className="grid gap-4 md:grid-cols-3">
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
