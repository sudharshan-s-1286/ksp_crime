import type { ReactNode, FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { Login } from '../views/Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-[#FF7A00]"></span>
          </div>
          <span style={{ fontSize: '14px', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>SECURE KSP DECRYPTING...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};
