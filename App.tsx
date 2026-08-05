
import React, { createContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import HomePage from './pages/Home';
import CatalogPage from './pages/Catalog';
import ProductDetailsPage from './pages/ProductDetails';
import AboutPage from './pages/About';
import ContactPage from './pages/ContactPage';
import CheckoutShipping from './pages/checkout/Shipping';
import CheckoutMessage from './pages/checkout/Message';
import CheckoutPayment from './pages/checkout/Payment';
import ConfirmationCallback from './pages/checkout/ConfirmationCallback';
import PaymentWaitingPage from './pages/checkout/PaymentWaitingPage';
import MaintenancePage from './pages/MaintenancePage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLogin';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminOrderDetailPage from './pages/admin/OrderDetailPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminProductsPage from './pages/admin/ProductsPage';
import AdminCategoriesPage from './pages/admin/CategoriesPage';
import AdminAddonsPage from './pages/admin/AddonsPage';
import AdminOccasionsPage from './pages/admin/OccasionsPage';
import AdminDashboardPage from './pages/admin/DashboardPage'; // Imported
import AdminCouponsPage from './pages/admin/CouponsPage';
import AdminShippingRulesPage from './pages/admin/ShippingRulesPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import LiveChatPage from './pages/admin/LiveChatPage'; // Imported Live Chat
import MetaEventsPage from './pages/admin/MetaEventsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import ProfileLayout from './pages/account/ProfileLayout';
import ProfilePage from './pages/account/ProfilePage';
import AddressesPage from './pages/account/AddressesPage';
import { CheckoutState } from './types';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthEventHandler from './components/AuthEventHandler';
import WhatsAppButton from './components/WhatsAppButton';

// Context for managing checkout state across steps
import { CheckoutContext } from './context/CheckoutContext';
import { CheckoutProvider } from './context/CheckoutProvider';
import SEO from './components/SEO';
import { supabase } from './lib/supabase';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFoundPage from './pages/NotFoundPage';
import { useVisitorTracker } from './hooks/useVisitorTracker';
const App = () => {
    useVisitorTracker();
    console.log("App component rendering...");
    const [siteSettings, setSiteSettings] = useState<{ title: string, description: string } | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase.from('site_settings').select('key, value');
                if (data) {
                    const title = data.find(s => s.key === 'site_title')?.value;
                    const desc = data.find(s => s.key === 'site_description')?.value;
                    const maintenance = data.find(s => s.key === 'maintenance_mode')?.value === 'true';

                    setMaintenanceMode(maintenance);

                    if (title || desc) {
                        setSiteSettings({
                            title: title || 'Blue Velvet Florería',
                            description: desc || 'Florería exclusiva en Chihuahua. Envíos a domicilio de ramos buchones, rosas premium y arreglos de lujo. Calidad garantizada para San Valentín y cualquier ocasión especial.'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching site settings', error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);



    return (
        <CheckoutProvider>
            <SEO
                title={siteSettings?.title}
                description={siteSettings?.description}
            />
            <Router>
                <AuthEventHandler />
                {maintenanceMode && !window.location.hash.startsWith('#/admin') ? (
                    <MaintenancePage />
                ) : (
                    <>
                        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
                            <Routes>
                        <Route path="/" element={<CatalogPage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/product/:id" element={<ProductDetailsPage />} />
                        {/* Fallback for generic product route */}
                        <Route path="/product" element={<ProductDetailsPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />

                        {/* Checkout Routes */}
                        <Route path="/checkout/shipping" element={<CheckoutShipping />} />
                        <Route path="/checkout/message" element={<CheckoutMessage />} />
                        <Route path="/checkout/payment" element={<CheckoutPayment />} />
                        <Route path="/checkout/callback" element={<ConfirmationCallback />} />
                        <Route path="/checkout/waiting/:orderId" element={<PaymentWaitingPage />} />
                        <Route path="/checkout/confirmation/:id" element={<OrderConfirmation />} />
                        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />

                        {/* Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/update-password" element={<ResetPasswordPage />} />

                        {/* Account Routes */}
                        <Route path="/account" element={<ProfileLayout />}>
                            <Route index element={<Navigate to="/account/profile" replace />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="addresses" element={<AddressesPage />} />
                            <Route path="orders" element={<OrderHistory />} />
                        </Route>

                        {/* Catch All - 404 */}
                        <Route path="*" element={<NotFoundPage />} />

                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboardPage />} />
                            <Route path="orders" element={<AdminOrdersPage />} />
                            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="products" element={<AdminProductsPage />} />
                            <Route path="products" element={<AdminProductsPage />} />
                            <Route path="categories" element={<AdminCategoriesPage />} />
                            <Route path="addons" element={<AdminAddonsPage />} />
                            <Route path="occasions" element={<AdminOccasionsPage />} />
                            <Route path="coupons" element={<AdminCouponsPage />} />
                            <Route path="shipping" element={<AdminShippingRulesPage />} />
                            <Route path="settings" element={<AdminSettingsPage />} />
                            <Route path="chat" element={<LiveChatPage />} />
                            <Route path="meta-events" element={<MetaEventsPage />} />
                        </Route>
                    </Routes>
                </div>
                <WhatsAppButton />
            </>
            )}
            </Router>
        </CheckoutProvider >
    );
};

export default App;
