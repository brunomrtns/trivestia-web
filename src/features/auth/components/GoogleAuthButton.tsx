import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { authEndpoints } from '@/services/endpoints/auth.endpoints';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function GoogleAuthButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Note: useGoogleLogin by default returns an Access Token if using the implicit flow.
      // However, for the 'idToken' requested by the backend, we might need to use the
      // Google Login button component or a different configuration.
      // If we use the code flow, we get a code to exchange.
      // Standard @react-oauth/google `useGoogleLogin` with default config returns access_token.
      // To get an ID Token, we usually use the `GoogleLogin` component which returns a credential (JWT).
      console.log('Google login success', tokenResponse);
    },
    onError: () => {
      toast.error(t('auth.login.google.error'));
    }
  });

  // Alternative: Using the standard GoogleLogin component is easier for ID Tokens
  return null;
}

import { GoogleLogin } from '@react-oauth/google';

export function GoogleAuthButtonStyled() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const slug = tenantSlug ?? '';
      const res = await authEndpoints.googleLogin(slug, credentialResponse.credential);
      setAuth(res.user, res.token, res.refreshToken, slug);
      toast.success(t('auth.login.toast.success', { name: res.user.name }));
      navigate(`/t/${slug}/app/dashboard`, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || t('auth.login.toast.error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          toast.error(t('auth.login.google.error'));
        }}
        useOneTap
        theme="outline"
        size="large"
        width="350" // Largura fixa em pixels (o Google exige string de número aqui)
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
