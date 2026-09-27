import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PublicInterview from './pages/PublicInterview';
import MeetingDetail from './pages/MeetingDetail';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import OfflineBanner from '@/components/OfflineBanner';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function RealtimeSyncProvider({ children }) {
  useRealtimeSync();
  return children;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <RealtimeSyncProvider>
          <Router>
            <NavigationTracker />
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* All app routes gated by ProtectedRoute */}
              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                <Route path="/" element={
                  <LayoutWrapper currentPageName={mainPageKey}>
                    <MainPage />
                  </LayoutWrapper>
                } />
                {Object.entries(Pages).map(([path, Page]) => (
                  <Route
                    key={path}
                    path={`/${path}`}
                    element={
                      <LayoutWrapper currentPageName={path}>
                        <Page />
                      </LayoutWrapper>
                    }
                  />
                ))}
                <Route path="/MeetingDetail" element={
                  <LayoutWrapper currentPageName="MeetingDetail">
                    <MeetingDetail />
                  </LayoutWrapper>
                } />
                <Route path="/pewawancara" element={<PublicInterview />} />
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <OfflineBanner />
          <Toaster />
        </RealtimeSyncProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App