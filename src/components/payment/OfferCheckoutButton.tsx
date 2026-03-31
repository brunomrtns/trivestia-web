import { useState } from 'react';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { paymentEndpoints } from '@/services/endpoints/payment.endpoints';
import type { Offer } from '@/types/api';

interface OfferCheckoutProps {
  offer: Offer;
  tenantSlug: string;
  onSuccess?: () => void;
}

export function OfferCheckoutButton({ offer, tenantSlug, onSuccess }: OfferCheckoutProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const result = await paymentEndpoints.createCheckout(tenantSlug, offer.id);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.enrolled) {
        toast.success('Inscrição realizada com sucesso!');
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  }

  function formatPrice() {
    if (!offer.priceAmount || !offer.priceCurrency) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: offer.priceCurrency.toUpperCase(),
    }).format(offer.priceAmount / 100);
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : offer.type === 'FREE' ? (
        <ShieldCheck className="h-4 w-4" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {offer.type === 'FREE'
        ? 'Inscrever-se Grátis'
        : offer.type === 'ONE_TIME'
          ? `Comprar - ${formatPrice()}`
          : `Assinar - ${formatPrice()}/${offer.billingInterval === 'MONTH' ? 'mês' : 'ano'}`}
    </button>
  );
}
