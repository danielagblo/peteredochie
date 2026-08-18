import React from 'react';
import { Route, Routes, Outlet, BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import ScrollToTop from './components/ScrollToTop';
import SiteLayout from './components/SiteLayout';
import PortalLayout from './components/PortalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import PetePage from './pages/PetePage';
import LegacyPage from './pages/LegacyPage';
import BookPage from './pages/BookPage';
import ShopPage from './pages/ShopPage';
import EventsPage from './pages/EventsPage';
import MentorshipPage from './pages/MentorshipPage';
import SponsorsPage from './pages/SponsorsPage';
import SponsorApplyPage from './pages/SponsorApplyPage';
import GalleryPage from './pages/GalleryPage';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AccountTypePage from './pages/AccountTypePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderPage from './pages/OrderPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';

const PublicLayout = () => (
    <SiteLayout>
        <Outlet />
    </SiteLayout>
);

const PortalLayoutRoute = () => (
    <PortalLayout>
        <Outlet />
    </PortalLayout>
);

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <AuthProvider>
                <AdminAuthProvider>
                    <CartProvider>
                        <Router>
                        <ScrollToTop />
                        <Routes>
                            {/* Public site (with header/footer) */}
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/pete-edochie" element={<PetePage />} />
                                <Route path="/legacy" element={<LegacyPage />} />
                                <Route path="/book" element={<BookPage />} />
                                <Route path="/shop" element={<ShopPage />} />
                                <Route path="/events" element={<EventsPage />} />
                                <Route path="/mentorship" element={<MentorshipPage />} />
                                <Route path="/sponsors" element={<SponsorsPage />} />
                                <Route
                                    path="/sponsor-apply"
                                    element={
                                        <ProtectedRoute>
                                            <SponsorApplyPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/gallery" element={<GalleryPage />} />
                                <Route path="/news" element={<NewsPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                 <Route
                                    path="/checkout"
                                    element={
                                        <ProtectedRoute>
                                            <CheckoutPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/order/:reference" element={<OrderPage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Route>

                            {/* Account portal (slim header, no footer) */}
                            <Route element={<PortalLayoutRoute />}>
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <DashboardPage />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            {/* Authentication Pages (no public chrome/header/footer) */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/join" element={<AccountTypePage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                            {/* Admin portal (standalone, no public chrome) */}
                            <Route path="/admin/login" element={<AdminLoginPage />} />
                            <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <AdminProtectedRoute>
                                        <AdminPortalPage />
                                    </AdminProtectedRoute>
                                }
                            />
                        </Routes>
                    </Router>
                    <Toaster />
                    </CartProvider>
                </AdminAuthProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
