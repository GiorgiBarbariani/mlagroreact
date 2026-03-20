import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { MainLayout } from '../layouts/MainLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Lazy load pages
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegistrationPage = lazy(() => import('../pages/RegistrationPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'));
const MainMenuPage = lazy(() => import('../pages/MainMenuPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const WeatherPage = lazy(() => import('../pages/weather/WeatherPage'));
const GisPage = lazy(() => import('../pages/weather/GisPage'));
const WeatherAnalyticsPage = lazy(() => import('../pages/weather/WeatherAnalyticsPage'));
const DictionariesPage = lazy(() => import('../pages/DictionariesPage'));
const ElectronicFieldMapPage = lazy(() => import('../pages/ElectronicFieldMapPage'));
const ElectronicFieldMapFieldsPage = lazy(() => import('../pages/ElectronicFieldMapFieldsPage'));
const ElectronicFieldMapFieldDetailPage = lazy(() => import('../pages/ElectronicFieldMapFieldDetailPage'));
const CompanyPage = lazy(() => import('../pages/company/CompanyPage'));
const EmployeeManagementPage = lazy(() => import('../pages/company/EmployeeManagementPage'));
const CompanyTasksPage = lazy(() => import('../pages/company/CompanyTasksPage'));
const ChatPage = lazy(() => import('../pages/company/ChatPage'));
const CompanySettingsPage = lazy(() => import('../pages/company/CompanySettingsPage'));
const MyFieldsPage = lazy(() => import('../pages/MyFieldsPage'));
const SatelliteDataPage = lazy(() => import('../pages/satellite/SatelliteDataPage'));
const SatelliteImagesPage = lazy(() => import('../pages/satellite/SatelliteImagesPage'));
const SatelliteImagesAdminPage = lazy(() => import('../pages/satellite/SatelliteImagesAdminPage'));
const SubscriptionPlansPage = lazy(() => import('../pages/SubscriptionPlansPage'));
const UserSupportTicketsPage = lazy(() => import('../pages/support/UserSupportTicketsPage'));
const UserChatPage = lazy(() => import('../pages/support/UserChatPage'));
const TaskSchedulerPage = lazy(() => import('../pages/admin/TaskSchedulerPage'));
const LoggingPage = lazy(() => import('../pages/admin/LoggingPage'));
const SystemStatusPage = lazy(() => import('../pages/admin/SystemStatusPage'));
const AppealsPage = lazy(() => import('../pages/admin/AppealsPage'));
const FileStoragePage = lazy(() => import('../pages/admin/FileStoragePage'));
const ApiTestPage = lazy(() => import('../pages/ApiTestPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UnderDevelopmentPage = lazy(() => import('../pages/UnderDevelopmentPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const PlantDiseasePage = lazy(() => import('../pages/PlantDiseasePage'));

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Convenience redirects to /app/* */}
        <Route path="/main-menu" element={<Navigate to="/app/main-menu" replace />} />
        <Route path="/weather" element={<Navigate to="/app/weather" replace />} />
        <Route path="/weather/:page" element={<Navigate to="/app/weather/:page" replace />} />
        <Route path="/dictionaries" element={<Navigate to="/app/dictionaries" replace />} />
        <Route path="/dictionaries/:section" element={<Navigate to="/app/dictionaries/:section" replace />} />
        <Route path="/dictionaries/:section/:page" element={<Navigate to="/app/dictionaries/:section/:page" replace />} />
        <Route path="/electronic-field-map" element={<Navigate to="/app/electronic-field-map" replace />} />
        <Route path="/company" element={<Navigate to="/app/company" replace />} />
        <Route path="/company/:page" element={<Navigate to="/app/company/:page" replace />} />
        <Route path="/satellite-data" element={<Navigate to="/app/satellite-data" replace />} />
        <Route path="/satellite-images" element={<Navigate to="/app/satellite-images" replace />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/subscription" element={<Navigate to="/app/subscription" replace />} />
        <Route path="/my-fields" element={<Navigate to="/app/my-fields" replace />} />
        <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
        <Route path="/admin/:page" element={<Navigate to="/app/admin/:page" replace />} />
        <Route path="/gis" element={<Navigate to="/app/weather/gis" replace />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<Navigate to="/app/main-menu" replace />} />
            <Route path="main-menu" element={<MainMenuPage />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Weather Routes */}
            <Route path="weather">
              <Route index element={<WeatherPage />} />
              <Route path="gis" element={<GisPage />} />
              <Route path="map" element={<UnderDevelopmentPage />} />
              <Route path="analytics" element={<WeatherAnalyticsPage />} />
            </Route>

            {/* Dictionary Routes */}
            <Route path="dictionaries" element={<DictionariesPage />} />
            <Route path="dictionaries/:section" element={<DictionariesPage />} />
            <Route path="dictionaries/:section/:page" element={<DictionariesPage />} />

            {/* Electronic Field Map */}
            <Route path="electronic-field-map" element={<ElectronicFieldMapPage />} />
            <Route path="electronic-field-map/fields" element={<ElectronicFieldMapFieldsPage />} />
            <Route path="electronic-field-map/fields/:fieldId/:tab" element={<ElectronicFieldMapFieldDetailPage />} />
            <Route path="electronic-field-map/:page" element={<ElectronicFieldMapPage />} />
            <Route path="electronic-field-map/:page/:subpage" element={<ElectronicFieldMapPage />} />

            {/* Company Routes */}
            <Route path="company">
              <Route index element={<CompanyPage />} />
              <Route path="employees" element={<EmployeeManagementPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="tasks" element={<CompanyTasksPage />} />
              <Route path="settings" element={<CompanySettingsPage />} />
            </Route>

            {/* My Fields */}
            <Route path="my-fields" element={<MyFieldsPage />} />

            {/* Satellite Routes */}
            <Route path="satellite-data" element={<SatelliteDataPage />} />
            <Route path="satellite-images" element={<SatelliteImagesPage />} />
            <Route path="satellite-images-admin" element={<SatelliteImagesAdminPage />} />

            {/* Subscription */}
            <Route path="subscription" element={<SubscriptionPlansPage />} />

            {/* Help/Support Routes */}
            <Route path="help">
              <Route path="documentation" element={<UnderDevelopmentPage />} />
              <Route path="support-tickets" element={<UserSupportTicketsPage />} />
              <Route path="support-tickets/chat/:id" element={<UserChatPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="admin">
                <Route index element={<ElectronicFieldMapPage />} />
                <Route path="task-scheduler" element={<TaskSchedulerPage />} />
                <Route path="logging" element={<LoggingPage />} />
                <Route path="system-status" element={<SystemStatusPage />} />
                <Route path="appeals" element={<AppealsPage />} />
                <Route path="appeals/chat" element={<ChatPage />} />
                <Route path="appeals/chat/:id" element={<ChatPage />} />
                <Route path="file-storage" element={<FileStoragePage />} />
              </Route>
            </Route>

            {/* Under Development Routes */}
            <Route path="notifications" element={<UnderDevelopmentPage />} />
            <Route path="uav-data" element={<UnderDevelopmentPage />} />
            <Route path="map" element={<UnderDevelopmentPage />} />
            <Route path="crop-identification" element={<UnderDevelopmentPage />} />
            <Route path="reports" element={<UnderDevelopmentPage />} />
            <Route path="upload-images" element={<UnderDevelopmentPage />} />
            <Route path="fields-passport" element={<UnderDevelopmentPage />} />
            <Route path="services" element={<UnderDevelopmentPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="plant-disease" element={<PlantDiseasePage />} />
            <Route path="users" element={<UnderDevelopmentPage />} />

            {/* API Test (for development) */}
            <Route path="api-test" element={<ApiTestPage />} />
          </Route>
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};