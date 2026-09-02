import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
    Activity,
    ClipboardList,
    GraduationCap,
    Handshake,
    KeyRound,
    LogOut,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { Panel, Stat, EmptyState } from '@/components/dashboard/DashboardShell';
import { api, apiCrud } from '@/lib/api';
import { formatUSD } from '@/lib/commerce';
import { REGISTRATION_TYPES, registrationTypeLabel } from '@/lib/mentorship';
import { PUBLISHER } from '@/lib/content';

const input =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';
const smallBtn =
    'border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]';
const dangerBtn =
    'border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]';

const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'country_manager', label: 'Country Manager' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'fulfillment_officer', label: 'Fulfillment Officer' },
    { value: 'sponsorship_manager', label: 'Sponsorship Manager' },
];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const TABS = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'orders', label: 'Orders', icon: ClipboardList },
    { key: 'sponsorships', label: 'Sponsorships', icon: Handshake },
    { key: 'mentorship', label: 'Mentorship', icon: GraduationCap },
    { key: 'history', label: 'Login History', icon: ShieldCheck },
    { key: 'password', label: 'Change Password', icon: KeyRound },
];

const ROLE_TAB_SCOPE = {
    super_admin: TABS.map((t) => t.key),
    inventory_manager: ['overview', 'orders', 'password'],
    sales_manager: ['overview', 'orders', 'password'],
    fulfillment_officer: ['overview', 'orders', 'password'],
    sponsorship_manager: ['overview', 'sponsorships', 'password'],
    country_manager: ['overview', 'password'],
};

const genTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let out = '';
    for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
};

const passwordScore = (pw) => {
    if (!pw) return { score: 0, label: '—' };
    let s = 0;
    if (pw.length >= 8) s += 1;
    if (pw.length >= 12) s += 1;
    if (/[a-z]/.test(pw)) s += 1;
    if (/[A-Z]/.test(pw)) s += 1;
    if (/[0-9]/.test(pw)) s += 1;
    if (/[^A-Za-z0-9]/.test(pw)) s += 1;
    const label = s >= 5 ? 'Strong' : s >= 3 ? 'Fair' : 'Weak';
    return { score: Math.min(s, 5), label };
};

const AdminPortalPage = () => {
    const { adminUser, role, isSuperAdmin, adminLogout, mustChangePassword, clearMustChangePassword } =
        useAdminAuth();

    const allowedTabs = useMemo(() => {
        const scope = ROLE_TAB_SCOPE[role] || TABS.map((t) => t.key);
        return TABS.filter((t) => scope.includes(t.key));
    }, [role]);

    const [tab, setTab] = useState(allowedTabs[0]?.key || 'overview');

    // Force the password tab when a first-login change is required.
    useEffect(() => {
        if (mustChangePassword) setTab('password');
    }, [mustChangePassword]);

    const [orders, setOrders] = useState([]);
    const [sponsorships, setSponsorships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [materialForm, setMaterialForm] = useState({
        title: '', description: '', module: '', cohort: '2027', registration_type: 'standard', sort: '', url: '', video_url: '', published: true,
    });

    const load = useCallback(async () => {
        setError('');
        try {
            const fetchers = {
                orders: () => apiCrud.list('orders', { sort: '-created' }),
                sponsorships: () => apiCrud.list('sponsorships', { sort: '-created' }).catch(() => []),
                applications: () => apiCrud.list('mentorship-applications', { sort: '-created' }).catch(() => []),
                materials: () => apiCrud.list('mentorship-materials', { sort: 'sort,title' }).catch(() => []),
                employees: () => apiCrud.list('users', { sort: '-created' }).catch(() => []),
                countries: () => apiCrud.list('countries', { sort: 'name' }).catch(() => []),
            };
            const keys = Object.keys(fetchers);
            const results = await Promise.all(keys.map((k) => fetchers[k]()));
            const map = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
            setOrders(map.orders);
            setSponsorships(map.sponsorships);
            setApplications(map.applications);
            setMaterials(map.materials);
            setEmployees(
                (map.employees || []).filter((u) => u.staff_role || u.account_type === 'admin'),
            );
            setCountries(map.countries);
        } catch (_) {
            setError('Some administration data could not be loaded.');
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // ---- Employee management ----
    const blankEmp = {
        email: '',
        name: '',
        role: 'inventory_manager',
        country_assignment: '',
        staff_status: 'active',
        sendWelcome: true,
    };
    const [empForm, setEmpForm] = useState(blankEmp);
    const [editingEmp, setEditingEmp] = useState(null);
    const [createdCreds, setCreatedCreds] = useState(null);

    const addEmployee = async (e) => {
        e.preventDefault();
        setError('');
        setNotice('');
        if (!empForm.email) {
            setError('Email is required.');
            return;
        }
        if (empForm.role === 'country_manager' && !empForm.country_assignment) {
            setError('Country assignment is required for Country Managers.');
            return;
        }
        const tempPw = genTempPassword();
        try {
            await apiCrud.create('users', {
                email: empForm.email,
                password: tempPw,
                passwordConfirm: tempPw,
                name: empForm.name,
                account_type: 'subscriber',
                staff_role: empForm.role,
                staff_status: empForm.staff_status,
                country_assignment: empForm.country_assignment,
                must_change_password: true,
                approval_status: 'approved',
            });
            if (empForm.sendWelcome) {
                try {
                    await api.post('/auth/request-password-reset', { email: empForm.email });
                } catch (_) {
                    /* best effort */
                }
            }
            setCreatedCreds({ email: empForm.email, tempPw, welcomeSent: empForm.sendWelcome });
            setEmpForm(blankEmp);
            await load();
            setNotice('Employee created. Share the temporary password below.');
        } catch (err) {
            const data = err?.payload || {};
            const firstField = Object.keys(data)[0];
            setError(
                firstField
                    ? `${firstField}: ${data[firstField]?.message || 'invalid value'}`
                    : err?.message || 'Could not create that employee. The email may already be in use.',
            );
        }
    };

    const empFormRef = React.useRef(null);

    const startEditEmp = (u) => {
        setError('');
        setNotice('');
        setEditingEmp(u);
        setEmpForm({
            email: u.email || '',
            name: u.name || '',
            role: u.staff_role || 'inventory_manager',
            country_assignment: u.country_assignment || '',
            staff_status: u.staff_status || 'active',
            sendWelcome: false,
        });
        setCreatedCreds(null);
        window.setTimeout(() => {
            empFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    };

    const saveEditEmp = async (e) => {
        e.preventDefault();
        setError('');
        if (!editingEmp) return;
        try {
            await apiCrud.update('users', editingEmp.id, {
                name: empForm.name,
                staff_role: empForm.role,
                staff_status: empForm.staff_status,
                country_assignment: empForm.country_assignment,
            });
            setEditingEmp(null);
            setEmpForm(blankEmp);
            await load();
            setNotice('Employee updated.');
        } catch (err) {
            const data = err?.payload || {};
            const field = Object.keys(data)[0];
            setError(
                field
                    ? `${field}: ${data[field]?.message || 'invalid value'}`
                    : err?.message || 'Could not update that employee.',
            );
        }
    };

    const toggleEmployeeStatus = async (u) => {
        setError('');
        setNotice('');
        const next = u.staff_status === 'inactive' ? 'active' : 'inactive';
        if (
            next === 'inactive' &&
            !window.confirm(`Deactivate ${u.name || u.email}? They will no longer be able to sign in.`)
        ) {
            return;
        }
        try {
            await apiCrud.update('users', u.id, { staff_status: next });
            await load();
            setNotice(`${u.name || u.email} ${next === 'inactive' ? 'deactivated' : 'reactivated'}.`);
        } catch (err) {
            setError(err?.message || 'Could not update that employee.');
        }
    };

    const removeEmployee = async (u) => {
        setError('');
        setNotice('');
        if (!window.confirm(`Permanently remove ${u.name || u.email}? This cannot be undone.`)) return;
        try {
            await apiCrud.remove('users', u.id);
            load();
            setNotice(`${u.name || u.email} removed.`);
        } catch (_) {
            setError('Could not remove that employee.');
        }
    };

    const resetEmployeePassword = async (u) => {
        setError('');
        setNotice('');
        if (!window.confirm(`Reset the password for ${u.name || u.email}?`)) return;
        const tempPw = genTempPassword();
        try {
            await api.post('/auth/admin/set-password', {
                user_id: u.id,
                password: tempPw,
                mustChange: true,
            });
            setCreatedCreds({ email: u.email, tempPw, welcomeSent: false, reset: true });
            setNotice('Password reset. Share the temporary password below.');
            await load();
        } catch (err) {
            setError(err?.message || 'Could not reset that password.');
        }
    };

    // ---- Orders ----
    const updateOrderStatus = async (id, order_status) => {
        try {
            await apiCrud.update('orders', id, { order_status });
            load();
        } catch (_) {
            setError('Could not update that order.');
        }
    };

    // ---- Sponsorships ----
    const setSponsorshipStatus = async (id, status) => {
        try {
            await apiCrud.update('sponsorships', id, { status });
            load();
        } catch (_) {
            setError('Could not update that sponsorship.');
        }
    };

    // ---- Mentorship ----
    const setMentorshipStatus = async (id, status, registrationType) => {
        try {
            const app = applications.find((a) => a.id === id);
            const payload = { status };
            if (status === 'accepted') {
                payload.registration_type = registrationType || app?.registration_type || app?.requested_type || 'standard';
            }
            await apiCrud.update('mentorship-applications', id, payload);
            load();
        } catch (_) {
            setError('Could not update that application.');
        }
    };

    const setMentorshipRegistrationType = async (id, registrationType) => {
        try {
            await apiCrud.update('mentorship-applications', id, { registration_type: registrationType });
            load();
        } catch (_) {
            setError('Could not update registration type.');
        }
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
        } catch (_) {
            setError('Could not publish that material.');
        }
    };

    const deleteMaterial = async (id) => {
        try {
            await apiCrud.remove('mentorship-materials', id);
            load();
        } catch (_) {
            setError('Could not delete that material.');
        }
    };

    // ---- Change password ----
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwBusy, setPwBusy] = useState(false);
    const [pwMsg, setPwMsg] = useState({ kind: '', text: '' });

    const score = passwordScore(pwForm.next);

    const changePassword = async (e) => {
        e.preventDefault();
        setPwMsg({ kind: '', text: '' });
        if (pwForm.next !== pwForm.confirm) {
            setPwMsg({ kind: 'error', text: 'The new passwords do not match.' });
            return;
        }
        if (score.score < 3) {
            setPwMsg({ kind: 'error', text: 'Choose a stronger password (12+ chars, mixed case, number, symbol).' });
            return;
        }
        setPwBusy(true);
        try {
            await api.post('/auth/change-password', {
                current_password: pwForm.current,
                password: pwForm.next,
                password_confirm: pwForm.confirm,
            });
            setPwForm({ current: '', next: '', confirm: '' });
            setPwMsg({ kind: 'ok', text: 'Your password has been changed.' });
            clearMustChangePassword();
        } catch (err) {
            setPwMsg({
                kind: 'error',
                text:
                    err?.status === 400
                        ? 'Your current password is incorrect.'
                        : 'Could not change your password. Please try again.',
            });
        } finally {
            setPwBusy(false);
        }
    };

    const greeting = adminUser?.name || adminUser?.email?.split('@')[0] || 'Administrator';

    const paidOrders = orders.filter((o) => o.payment_status === 'paid');
    const revenue = paidOrders.reduce((n, o) => n + (Number(o.total_price) || 0), 0);
    const pendingApprovals = employees.filter((u) => u.approval_status === 'pending').length;
    const activeSponsors = sponsorships.filter((s) => s.status === 'approved').length;
    const pendingMentorship = applications.filter((a) => (a.status || 'pending') === 'pending').length;

    const locked = mustChangePassword && tab !== 'password';

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Admin Portal | King Dawie Publishing</title>
                <meta
                    name="description"
                    content="King Dawie Publishing administration portal — employees, orders, sponsorships, mentorship and platform operations for the Pete Edochie Legacy."
                />
            </Helmet>

            <div className="mx-auto grid max-w-[94rem] gap-8 px-5 py-10 md:grid-cols-[15rem_1fr] md:px-10">
                {/* Sidebar */}
                <aside className="md:sticky md:top-8 md:h-fit">
                    <div className="border border-border bg-card p-6">
                        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                            Admin portal
                        </p>
                        <p className="mt-2 font-display text-2xl">{greeting}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--gold))]">
                            {ROLE_LABEL[role] || 'Administrator'}
                        </p>
                        <div className="mt-5 border-t border-border pt-4">
                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                                Platform operator
                            </p>
                            <p className="mt-1 font-display text-base text-[hsl(var(--gold))]">
                                {PUBLISHER.name}
                            </p>
                        </div>
                    </div>

                    <nav className="mt-4 border border-border">
                        {allowedTabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                disabled={locked && key !== 'password'}
                                onClick={() => setTab(key)}
                                className={`flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left text-[0.68rem] uppercase tracking-[0.18em] transition-colors last:border-b-0 disabled:opacity-40 ${
                                    tab === key
                                        ? 'bg-[hsl(var(--primary))]/12 text-[hsl(var(--gold))]'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon size={15} strokeWidth={1.4} /> {label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-4 flex items-center justify-between gap-3 border border-border px-5 py-3">
                        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Appearance</span>
                        <ThemeToggle compact />
                    </div>

                    <button
                        type="button"
                        onClick={adminLogout}
                        className="mt-4 flex w-full items-center gap-3 border border-border px-5 py-4 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-[hsl(var(--primary))]"
                    >
                        <LogOut size={15} strokeWidth={1.4} /> Sign out
                    </button>
                    <Link
                        to="/"
                        className="mt-2 block px-1 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                        ← Back to public site
                    </Link>
                </aside>

                {/* Content */}
                <div className="space-y-6">
                    {mustChangePassword ? (
                        <div className="border border-[hsl(var(--primary))]/50 bg-[hsl(var(--primary))]/5 px-6 py-5 text-sm text-muted-foreground">
                            For security, you must set a new password before continuing. Use the
                            Change Password tab below.
                        </div>
                    ) : null}

                    {error ? (
                        <p className="border border-[hsl(var(--destructive))]/40 px-6 py-4 text-sm text-[hsl(var(--destructive))]">
                            {error}
                        </p>
                    ) : null}
                    {notice ? (
                        <p className="border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/5 px-6 py-4 text-sm text-[hsl(var(--gold))]">
                            {notice}
                        </p>
                    ) : null}

                    {tab === 'overview' ? (
                        <>
                            <Panel
                                title={`Welcome, ${greeting}`}
                                lead="Your command center for the Pete Edochie Legacy platform. Quick stats across commerce, partnerships and programmes are below."
                            >
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Stat label="Total orders" value={orders.length} />
                                    <Stat label="Revenue (paid)" value={formatUSD(revenue)} />
                                    <Stat label="Paid orders" value={paidOrders.length} />
                                    <Stat label="Pending approvals" value={pendingApprovals} />
                                    <Stat label="Active sponsors" value={activeSponsors} />
                                    <Stat
                                        label="Mentorship applications"
                                        value={applications.length}
                                        hint={`${pendingMentorship} pending review`}
                                    />
                                </div>
                            </Panel>

                            <Panel title="Team" lead="Staff accounts with portal access.">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <Stat label="Employees" value={employees.length} />
                                    <Stat
                                        label="Active"
                                        value={employees.filter((u) => u.staff_status === 'active').length}
                                    />
                                    <Stat
                                        label="Countries"
                                        value={countries.length}
                                        hint="Platform markets"
                                    />
                                </div>
                                {isSuperAdmin ? (
                                    <button
                                        type="button"
                                        onClick={() => setTab('employees')}
                                        className={smallBtn}
                                    >
                                        Manage employees
                                    </button>
                                ) : null}
                            </Panel>
                        </>
                    ) : null}

                    {tab === 'employees' ? (
                        <Panel
                            title="Employee management"
                            lead="Add staff accounts, assign roles, edit details, reset passwords and deactivate access. New employees receive a temporary password and must change it on first login."
                        >
                            {createdCreds ? (
                                <div className="mb-6 border border-[hsl(var(--gold))]/50 bg-[hsl(var(--gold))]/5 px-6 py-5">
                                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                        {createdCreds.reset ? 'Temporary password' : 'Employee created'}
                                    </p>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Email: <span className="text-foreground">{createdCreds.email}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Temporary password:{' '}
                                        <span className="font-mono text-[hsl(var(--gold))]">
                                            {createdCreds.tempPw}
                                        </span>
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {createdCreds.welcomeSent
                                            ? 'A password-setup email has also been sent. Share this password securely with the employee.'
                                            : 'No welcome email was sent. Share this password securely with the employee.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setCreatedCreds(null)}
                                        className={smallBtn}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            ) : null}

                            {editingEmp ? (
                                <div className="mb-4 border border-[hsl(var(--gold))]/40 px-4 py-3 text-xs text-[hsl(var(--gold))]">
                                    Editing {editingEmp.name || editingEmp.email}
                                </div>
                            ) : null}

                            <form
                                ref={empFormRef}
                                onSubmit={editingEmp ? saveEditEmp : addEmployee}
                                className="grid gap-4 md:grid-cols-2"
                            >
                                <input
                                    required
                                    type="email"
                                    placeholder="Email address"
                                    value={empForm.email}
                                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                                    className={input}
                                    disabled={!!editingEmp}
                                />
                                <input
                                    placeholder="Full name"
                                    value={empForm.name}
                                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                                    className={input}
                                />
                                <select
                                    value={empForm.role}
                                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                                    className={input}
                                >
                                    {ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={empForm.staff_status}
                                    onChange={(e) => setEmpForm({ ...empForm, staff_status: e.target.value })}
                                    className={input}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {empForm.role === 'country_manager' ? (
                                    <select
                                        value={empForm.country_assignment}
                                        onChange={(e) =>
                                            setEmpForm({ ...empForm, country_assignment: e.target.value })
                                        }
                                        className={`${input} md:col-span-2`}
                                    >
                                        <option value="">Assign country…</option>
                                        {countries.map((c) => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                                {!editingEmp ? (
                                    <label className="flex items-center gap-3 text-xs text-muted-foreground md:col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={empForm.sendWelcome}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, sendWelcome: e.target.checked })
                                            }
                                            className="h-4 w-4 accent-[hsl(var(--primary))]"
                                        />
                                        Send a welcome / password-setup email to the employee
                                    </label>
                                ) : null}
                                <div className="flex gap-3 md:col-span-2">
                                    <button
                                        type="submit"
                                        className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white"
                                    >
                                        {editingEmp ? 'Update employee' : 'Add employee'}
                                    </button>
                                    {editingEmp ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingEmp(null);
                                                setEmpForm(blankEmp);
                                            }}
                                            className={smallBtn}
                                        >
                                            Cancel
                                        </button>
                                    ) : null}
                                </div>
                            </form>

                            <ul className="mt-8 divide-y divide-border">
                                {employees.length === 0 ? (
                                    <EmptyState>No employees yet. Add your first staff member above.</EmptyState>
                                ) : null}
                                {employees.map((u) => (
                                    <li key={u.id} className="py-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="max-w-md">
                                                <p className="font-display text-lg">{u.name || u.email}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{u.email}</p>
                                                <p className="mt-1 text-xs text-[hsl(var(--gold))]">
                                                    {ROLE_LABEL[u.staff_role] || u.staff_role}
                                                    {u.country_assignment ? ` · ${u.country_assignment}` : ''}
                                                </p>
                                                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    {u.staff_status === 'active' ? 'Active' : 'Inactive'}
                                                    {u.must_change_password ? ' · must change password' : ''}
                                                    {u.last_login ? ` · last login ${fmtDate(u.last_login)}` : ' · never signed in'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button type="button" onClick={() => startEditEmp(u)} className={smallBtn}>
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => resetEmployeePassword(u)}
                                                    className={smallBtn}
                                                >
                                                    Reset password
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEmployeeStatus(u)}
                                                    className={smallBtn}
                                                >
                                                    {u.staff_status === 'inactive' ? 'Activate' : 'Deactivate'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmployee(u)}
                                                    className={dangerBtn}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'orders' ? (
                        <Panel
                            title="Orders"
                            lead="Every order across books, tickets and merchandise. Update fulfilment status below."
                        >
                            {orders.length === 0 ? (
                                <EmptyState>No orders yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {orders.slice(0, 60).map((o) => (
                                        <li key={o.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                            <div className="max-w-md">
                                                <p className="font-display text-lg">{o.items_summary || 'Order'}</p>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {o.payment_reference || o.id}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {o.email} · {fmtDate(o.created)}
                                                </p>
                                                <p className="mt-2 text-sm text-[hsl(var(--gold))]">
                                                    {formatUSD(o.total_price)} · payment {o.payment_status}
                                                </p>
                                            </div>
                                            <select
                                                value={o.order_status || 'pending'}
                                                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                className={input}
                                            >
                                                {ORDER_STATUSES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'sponsorships' ? (
                        <Panel
                            title="Sponsorship applications"
                            lead="Review corporate sponsorship applications, approve or reject, and track investment payments."
                        >
                            {sponsorships.length === 0 ? (
                                <EmptyState>No sponsorship applications yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {sponsorships.map((s) => (
                                        <li key={s.id} className="py-5">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="max-w-md">
                                                    <p className="font-display text-lg">{s.company_name}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {s.contact_person} · {s.email} · {s.country || 'Country not set'}
                                                    </p>
                                                    <p className="mt-2 text-sm text-[hsl(var(--gold))]">
                                                        {s.package?.name || s.package_tier || 'Package'} ·{' '}
                                                        {formatUSD(s.investment_amount || s.package?.price)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                        {s.status || 'pending'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSponsorshipStatus(s.id, 'approved')}
                                                        className={smallBtn}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSponsorshipStatus(s.id, 'rejected')}
                                                        className={dangerBtn}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'mentorship' ? (
                        <>
                        <Panel
                            title="Mentorship applications"
                            lead="Review applications, assign registration type on acceptance, and manage programme materials."
                        >
                            {applications.length === 0 ? (
                                <EmptyState>No applications submitted.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {applications.map((a) => (
                                        <li key={a.id} className="py-5">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="max-w-xl">
                                                    <p className="font-display text-lg">{a.name || a.email}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {a.email} · {a.country || 'Country not set'} ·{' '}
                                                        {a.discipline || 'Discipline not set'} · {a.cohort || '2027'} cohort
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Requested: {registrationTypeLabel(a.requested_type || 'standard')}
                                                        {a.registration_type ? ` · Assigned: ${registrationTypeLabel(a.registration_type)}` : ''}
                                                    </p>
                                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                                        {a.statement}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                        {a.status || 'pending'}
                                                    </span>
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
                                                    <div className="flex items-center gap-2">
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
                                                        <button
                                                            type="button"
                                                            onClick={() => setMentorshipStatus(a.id, 'rejected')}
                                                            className={dangerBtn}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
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

                    {tab === 'history' ? (
                        <Panel
                            title="Login history"
                            lead="Recent sign-ins for your account and the wider team. Auto-logout occurs after 30 minutes of inactivity."
                        >
                            <div className="mb-6">
                                <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                                    Your last sign-in
                                </p>
                                <p className="mt-2 font-display text-2xl text-[hsl(var(--gold))]">
                                    {fmtDate(adminUser?.last_login)}
                                </p>
                            </div>

                            <p className="mb-4 text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                                Team sign-ins
                            </p>
                            {employees.length === 0 ? (
                                <EmptyState>No team login records yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {employees.map((u) => {
                                        const history = Array.isArray(u.login_history) ? u.login_history : [];
                                        return (
                                            <li key={u.id} className="py-4">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-display text-base">
                                                            {u.name || u.email}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {ROLE_LABEL[u.staff_role] || u.staff_role}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">
                                                            Last login: {fmtDate(u.last_login)}
                                                        </p>
                                                        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                            {history.length} sign-in{history.length === 1 ? '' : 's'} recorded
                                                        </p>
                                                    </div>
                                                </div>
                                                {history.length > 0 ? (
                                                    <ul className="mt-3 space-y-1 pl-4 text-xs text-muted-foreground">
                                                        {history
                                                            .slice(-5)
                                                            .reverse()
                                                            .map((h, i) => (
                                                                <li key={i}>· {fmtDate(h.at)}</li>
                                                            ))}
                                                    </ul>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'password' ? (
                        <Panel
                            title="Change password"
                            lead="Set a new admin password. You must enter your current password to confirm the change."
                        >
                            <form onSubmit={changePassword} className="grid gap-5 md:max-w-md">
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="cp-current"
                                        className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                                    >
                                        Current password
                                    </label>
                                    <input
                                        id="cp-current"
                                        type="password"
                                        required
                                        value={pwForm.current}
                                        onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                                        className={input}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="cp-next"
                                        className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                                    >
                                        New password
                                    </label>
                                    <input
                                        id="cp-next"
                                        type="password"
                                        required
                                        value={pwForm.next}
                                        onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                                        className={input}
                                    />
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden bg-border">
                                            <div
                                                className="h-full bg-[hsl(var(--gold))] transition-all"
                                                style={{ width: `${(score.score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            {score.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="cp-confirm"
                                        className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                                    >
                                        Confirm new password
                                    </label>
                                    <input
                                        id="cp-confirm"
                                        type="password"
                                        required
                                        value={pwForm.confirm}
                                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                                        className={input}
                                    />
                                </div>
                                {pwMsg.text ? (
                                    <p
                                        className={
                                            pwMsg.kind === 'ok'
                                                ? 'text-sm text-[hsl(var(--gold))]'
                                                : 'text-sm text-[hsl(var(--destructive))]'
                                        }
                                    >
                                        {pwMsg.text}
                                    </p>
                                ) : null}
                                <button
                                    type="submit"
                                    disabled={pwBusy}
                                    className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white disabled:opacity-60"
                                >
                                    {pwBusy ? 'Saving…' : 'Update password'}
                                </button>
                            </form>
                        </Panel>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default AdminPortalPage;
