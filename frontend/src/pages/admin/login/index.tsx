import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '@mui/material';
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
              <TextField
                fullWidth
                type="email"
                id="email"
                label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                autoComplete="email"
                size="small"
              />
            </div>

            {/* Password field */}
            <div>
              <TextField
                fullWidth
                type="password"
                id="password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                size="small"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                bgcolor: 'rgb(15, 23, 42)',
                '&:hover': { bgcolor: 'rgb(30, 41, 59)' },
                textTransform: 'none',
                py: 1.25
              }}
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Eres profesional?{' '}
          <Button
            onClick={() => navigate('/login/professional')}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              p: 0,
              minWidth: 'auto',
              '&:hover': { backgroundColor: 'transparent' }
            }}
          >
            Ingresa aquí
          </Button>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
