import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AppShell } from './components/AppShell.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CreateIssuePage } from './pages/CreateIssuePage.jsx';
import { IssueDetailPage } from './pages/IssueDetailPage.jsx';
import { ArchivedPage } from './pages/ArchivedPage.jsx';
import { CreateUserPage } from './pages/CreateUserPage.jsx';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="new" element={<CreateIssuePage />} />
              <Route path="issues/:id" element={<IssueDetailPage />} />
              <Route path="archived" element={<ArchivedPage />} />
              <Route path="users/new" element={<CreateUserPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
