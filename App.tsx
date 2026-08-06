import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MaintenancePage from './pages/MaintenancePage';
import AuthEventHandler from './components/AuthEventHandler';
import WhatsAppButton from './components/WhatsAppButton';

// Context for managing checkout state across steps
import { CheckoutProvider } from './context/CheckoutProvider';
import SEO from './components/SEO';
import { supabase } from './lib/supabase';
import { useVisitorTracker } from './hooks/useVisitorTracker';

import { ErrorBoundary } from './components/routing/ErrorBoundary';
import { RouteFallback } from './components/routing/RouteFallback';
import {
  CatalogPage,
  HomePage,
  ProductDetailsPage,
  AboutPage,
  ContactPage,
  PrivacyPolicy,
  TermsOfService,
  NotFoundPage,
  OrderConfirmation,
  CheckoutShipping,
  CheckoutMessage,
  CheckoutPayment,
  ConfirmationCallback,
  PaymentWaitingPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfileLayout,
  ProfilePage,
  AddressesPage,
  OrderHistory,
  AdminLayout,
  AdminLoginPage,
  AdminDashboardPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminUsersPage,
  AdminProductsPage,
  AdminCategoriesPage,
  AdminAddonsPage,
  AdminOccasionsPage,
  AdminCouponsPage,
  AdminShippingRulesPage,
  AdminSettingsPage,
  LiveChatPage,
  MetaEventsPage,
} from './components/routing/routes';

const App = () => {
    useVisitorTracker();
    const [siteSettings, setSiteSettings] = useState<{ title: string, description: string } | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
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
                            <ErrorBoundary>
                                <Suspense fallback={<RouteFallback />}>
                                    <Routes>
                                        <Route path="/" element={<CatalogPage />} />
                                        <Route path="/home" element={<HomePage />} />
                                        <Route path="/catalog" element={<CatalogPage />} />
                                        <Route path="/product/:id" element={<ProductDetailsPage />} />
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

                                        {/* Admin Routes */}
                                        <Route path="/admin/login" element={<AdminLoginPage />} />
                                        <Route path="/admin" element={<AdminLayout />}>
                                            <Route index element={<Navigate to="dashboard" replace />} />
                                            <Route path="dashboard" element={<AdminDashboardPage />} />
                                            <Route path="orders" element={<AdminOrdersPage />} />
                                            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                                            <Route path="users" element={<AdminUsersPage />} />
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

                                        {/* Catch All - 404 */}
                                        <Route path="*" element={<NotFoundPage />} />
                                    </Routes>
                                </Suspense>
                            </ErrorBoundary>
                        </div>
                        <WhatsAppButton />
                    </>
                )}
            </Router>
        </CheckoutProvider >
    );
};

export default App;
