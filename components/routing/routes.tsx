/**
 * routes — tabla de rutas de Blue Velvet con carga diferida (BV2-05).
 *
 * Solo el shell comercial mínimo queda eager (CatalogPage, ruta "/"). El resto
 * de páginas se cargan con React.lazy para que administración (incl. LiveChat),
 * checkout, cuenta, auth y políticas no estén en el chunk de entrada.
 * No cambia HashRouter ni los paths públicos (esa migración es BV2-10).
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

// Eager: entrada comercial (primer viewport).
import CatalogPage from '../../pages/Catalog';

export { CatalogPage };

// ---------------------------------------------------------------------------
// Storefront diferido
// ---------------------------------------------------------------------------
export const HomePage = lazy(() => import('../../pages/Home'));
export const ProductDetailsPage = lazy(() => import('../../pages/ProductDetails'));
export const AboutPage = lazy(() => import('../../pages/About'));
export const ContactPage = lazy(() => import('../../pages/ContactPage'));
export const PrivacyPolicy = lazy(() => import('../../pages/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('../../pages/TermsOfService'));
export const NotFoundPage = lazy(() => import('../../pages/NotFoundPage'));
export const OrderConfirmation = lazy(() => import('../../pages/OrderConfirmation'));

// ---------------------------------------------------------------------------
// Checkout diferido
// ---------------------------------------------------------------------------
export const CheckoutShipping = lazy(() => import('../../pages/checkout/Shipping'));
export const CheckoutMessage = lazy(() => import('../../pages/checkout/Message'));
export const CheckoutPayment = lazy(() => import('../../pages/checkout/Payment'));
export const ConfirmationCallback = lazy(() => import('../../pages/checkout/ConfirmationCallback'));
export const PaymentWaitingPage = lazy(() => import('../../pages/checkout/PaymentWaitingPage'));

// ---------------------------------------------------------------------------
// Auth diferido
// ---------------------------------------------------------------------------
export const LoginPage = lazy(() => import('../../pages/auth/LoginPage'));
export const RegisterPage = lazy(() => import('../../pages/auth/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('../../pages/auth/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('../../pages/auth/ResetPasswordPage'));

// ---------------------------------------------------------------------------
// Cuenta diferida
// ---------------------------------------------------------------------------
export const ProfileLayout = lazy(() => import('../../pages/account/ProfileLayout'));
export const ProfilePage = lazy(() => import('../../pages/account/ProfilePage'));
export const AddressesPage = lazy(() => import('../../pages/account/AddressesPage'));
export const OrderHistory = lazy(() => import('../../pages/OrderHistory'));

// ---------------------------------------------------------------------------
// Administración diferida (fuera del chunk de entrada)
// ---------------------------------------------------------------------------
export const AdminLayout = lazy(() => import('../../pages/admin/AdminLayout'));
export const AdminLoginPage = lazy(() => import('../../pages/admin/AdminLogin'));
export const AdminDashboardPage = lazy(() => import('../../pages/admin/DashboardPage'));
export const AdminOrdersPage = lazy(() => import('../../pages/admin/OrdersPage'));
export const AdminOrderDetailPage = lazy(() => import('../../pages/admin/OrderDetailPage'));
export const AdminUsersPage = lazy(() => import('../../pages/admin/UsersPage'));
export const AdminProductsPage = lazy(() => import('../../pages/admin/ProductsPage'));
export const AdminCategoriesPage = lazy(() => import('../../pages/admin/CategoriesPage'));
export const AdminAddonsPage = lazy(() => import('../../pages/admin/AddonsPage'));
export const AdminOccasionsPage = lazy(() => import('../../pages/admin/OccasionsPage'));
export const AdminCouponsPage = lazy(() => import('../../pages/admin/CouponsPage'));
export const AdminShippingRulesPage = lazy(() => import('../../pages/admin/ShippingRulesPage'));
export const AdminSettingsPage = lazy(() => import('../../pages/admin/SettingsPage'));
export const LiveChatPage = lazy(() => import('../../pages/admin/LiveChatPage'));
export const MetaEventsPage = lazy(() => import('../../pages/admin/MetaEventsPage'));

export type AnyLazy = LazyExoticComponent<ComponentType<unknown>>;
