import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { adminLogin, clearError } from '../../../store/slices/authSlice';
import { UserRole } from '../../../types';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Form submit → dispatch Redux action → API call → response updates state
// RULE: NO direct API calls from component
// RULE: Global loading spinner used (not individual spinner)

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, error } = useAppSelector((state) => state.auth);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.ADMIN) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    setFormError('');

    if (!email.trim()) {
      setFormError('El correo electrónico es requerido');
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Por favor ingrese un correo electrónico válido');
      return false;
    }

    if (!password) {
      setFormError('La contraseña es requerida');
      return false;
    }

    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Dispatch Redux action - NO direct API calls from component
    const result = await dispatch(adminLogin({ email, password }));

    if (adminLogin.fulfilled.match(result)) {
      // Success - navigation will happen via useEffect
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Error message */}
          {(error || formError) && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {formError || error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@ejemplo.com"
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Eres profesional?{' '}
          <button
            onClick={() => navigate('/login/professional')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Ingresa aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
