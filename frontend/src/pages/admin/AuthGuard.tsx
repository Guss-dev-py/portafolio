import { Navigate, Outlet } from 'react-router-dom';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthGuard() {
  const token = localStorage.getItem('token');
  const valid = isTokenValid(token);

  if (!valid) {
    const expired = token !== null; // token exists but is expired/invalid
    return (
      <Navigate
        to="/admin/login"
        replace
        state={expired ? { message: 'Tu sesión expiró, volvé a iniciar sesión' } : undefined}
      />
    );
  }

  return <Outlet />;
}
