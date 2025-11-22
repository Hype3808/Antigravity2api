import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthOverlay from './components/AuthOverlay';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tokens from './pages/Tokens';
import Keys from './pages/Keys';
import Test from './pages/Test';
import Docs from './pages/Docs';
import Logs from './pages/Logs';
import Monitor from './pages/Monitor';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthOverlay />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="keys" element={<Keys />} />
          <Route path="test" element={<Test />} />
          <Route path="docs" element={<Docs />} />
          <Route path="logs" element={<Logs />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
