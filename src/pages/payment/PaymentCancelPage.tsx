import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <XCircle className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">{t('payment.cancel.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('payment.cancel.subtitle')}
        </p>
        <button
          onClick={() => navigate('/create-school')}
          className="mt-8 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
        >
          {t('payment.cancel.actions.retry')}
        </button>
      </div>
    </div>
  );
}
