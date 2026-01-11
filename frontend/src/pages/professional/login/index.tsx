import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { professionalGoogleLogin, clearError } from '../../../store/slices/authSlice';
import { UserRole } from '../../../types';
import { ENV } from '../../../config/env';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Form submit → dispatch Redux action → API call → response updates state
// RULE: NO direct API calls from component
// RULE: Global loading spinner used (not individual spinner)

// Google Client ID from validated environment configuration (RULE: no hardcoded values)
const GOOGLE_CLIENT_ID = ENV.googleClientId;

// Declare global google type
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const ProfessionalLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, error } = useAppSelector((state) => state.auth);

  // Redirect if already logged in as professional
  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.PROFESSIONAL) {
      navigate('/professional/calendar');
    }
  }, [isAuthenticated, user, navigate]);

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      // Dispatch Redux action - NO direct API calls from component
      const result = await dispatch(professionalGoogleLogin(response.credential));

      if (professionalGoogleLogin.fulfilled.match(result)) {
        // Success - navigation will happen via useEffect
        navigate('/professional/calendar');
      }
    },
    [dispatch, navigate]
  );

  // Initialize Google Sign-In
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        // Render the button
        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 300,
          });
        }
      }
    };

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, [handleCredentialResponse]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md zoom-in-normal">
        {/* Card */}
        <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8 fade-down-fast">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 fade-up-fast">
              Acceso Profesionales
            </h1>
            <p className="mt-2 text-sm text-gray-600 fade-up-normal">
              Ingresa con tu cuenta de Google para gestionar tus citas
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 zoom-in-fast">
              {error}
            </div>
          )}

          {/* Google Client ID warning */}
          {!GOOGLE_CLIENT_ID && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 zoom-out-fast">
              Configuración de Google no disponible. Por favor contacta al administrador.
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="flex justify-center zoom-in-normal">
            <div id="google-signin-button" />
          </div>

          {/* Fallback button if Google script hasn't loaded */}
          {GOOGLE_CLIENT_ID && (
            <noscript>
              <div className="mt-4 text-center text-sm text-gray-600">
                Por favor habilita JavaScript para iniciar sesión con Google.
              </div>
            </noscript>
          )}

          {/* Benefits section */}
          <div className="mt-8 border-t pt-6 fade-up-slow">
            <h2 className="mb-4 text-center text-sm font-medium text-gray-900 fade-down-fast">
              ¿Por qué usar nuestra plataforma?
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2 fade-right-fast">
                <span className="text-green-500">✓</span>
                <span>Gestiona tus citas de forma automática 24/7</span>
              </li>
              <li className="flex items-start gap-2 fade-left-fast">
                <span className="text-green-500">✓</span>
                <span>Sincronización con Google Calendar</span>
              </li>
              <li className="flex items-start gap-2 fade-right-fast">
                <span className="text-green-500">✓</span>
                <span>Recordatorios automáticos por WhatsApp</span>
              </li>
              <li className="flex items-start gap-2 fade-left-fast">
                <span className="text-green-500">✓</span>
                <span>Reduce ausencias y cancelaciones</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer link */}
        <p className="mt-4 text-center text-sm text-gray-600 fade-up-slow">
          ¿Eres administrador?{' '}
          <button
            onClick={() => navigate('/login/admin')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Ingresa aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default ProfessionalLoginPage;
