import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Pages - используем именованные импорты
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import PricingPage from '@/pages/PricingPage'
import IntegrationsPage from '@/pages/IntegrationsPage'
import { DashboardPageNew } from '@/pages/DashboardPageNew'

// Industry Pages
import IndustrySelectPage from '@/pages/IndustrySelectPage'
import AvitoDashboard from '@/pages/AvitoDashboard'
import CafeDashboard from '@/pages/CafeDashboard'
import WarehouseDashboard from '@/pages/WarehouseDashboard'
import BeautySalonDashboard from '@/pages/BeautySalonDashboard'
import MarketingDashboard from '@/pages/MarketingDashboard'
import LogisticsDashboard from '@/pages/LogisticsDashboard'
import FinanceDashboard from '@/pages/FinanceDashboard'
import CRMDashboard from '@/pages/CRMDashboard'
import RetailDashboard from '@/pages/RetailDashboard'
import CustomDashboardPage from '@/pages/CustomDashboardPage'
import WhiteLabelSettingsPage from '@/pages/WhiteLabelSettingsPage'
import CSVMapperPage from '@/pages/CSVMapperPage'

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AnalyticsAIChat } from '@/components/AnalyticsAIChat'
import { LanguageProvider } from '@/context/LanguageContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Industry Selection */}
          <Route
            path="/industries"
            element={
              <ProtectedRoute>
                <IndustrySelectPage />
              </ProtectedRoute>
            }
          />

          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPageNew />
              </ProtectedRoute>
            }
          />

          {/* Industry-Specific Dashboards */}
          <Route
            path="/dashboard/avito"
            element={
              <ProtectedRoute>
                <AvitoDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/cafe"
            element={
              <ProtectedRoute>
                <CafeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/warehouse"
            element={
              <ProtectedRoute>
                <WarehouseDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/beauty"
            element={
              <ProtectedRoute>
                <BeautySalonDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/marketing"
            element={
              <ProtectedRoute>
                <MarketingDashboard />
              </ProtectedRoute>
            }
          />

          {/* Logistics Dashboard */}
          <Route
            path="/dashboard/logistics"
            element={
              <ProtectedRoute>
                <LogisticsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Retail Dashboard */}
          <Route
            path="/dashboard/retail"
            element={
              <ProtectedRoute>
                <RetailDashboard />
              </ProtectedRoute>
            }
          />

          {/* CRM Dashboard */}
          <Route
            path="/dashboard/crm"
            element={
              <ProtectedRoute>
                <CRMDashboard />
              </ProtectedRoute>
            }
          />

          {/* Finance Dashboard */}
          <Route
            path="/dashboard/finance"
            element={
              <ProtectedRoute>
                <FinanceDashboard />
              </ProtectedRoute>
            }
          />

          {/* Integrations */}
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Custom Dashboard with Drag & Drop */}
          <Route
            path="/custom-dashboard"
            element={
              <ProtectedRoute>
                <CustomDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* CSV Mapper */}
          <Route
            path="/mapper"
            element={
              <ProtectedRoute>
                <CSVMapperPage />
              </ProtectedRoute>
            }
          />

          {/* White Label Settings */}
          <Route
            path="/white-label"
            element={
              <ProtectedRoute>
                <WhiteLabelSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* 🤖 Analytics AI Chat - плавающая кнопка */}
        <AnalyticsAIChat />
      </BrowserRouter>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export default App
