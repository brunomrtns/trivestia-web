import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatToken } from './useChatToken';

// Importação dinâmica para evitar problemas de SSR com o Web Component
// @ts-expect-error — alias de vite, não reconhecido pelo tsc
import { ChatWidget } from '@chat-platform/chat-widget/react';

export function ChatFloating() {
  const { t } = useTranslation();
  const { chatToken, serverUrl, tenantId, isLoading, error } = useChatToken();
  const [open, setOpen] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // ref para chamar openConversation no widget via elemento do DOM
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // useCallback estável — evita re-registro do event listener a cada render
  const handleUnread = useCallback((convId: string, count: number) => {
    setUnreadMap((prev) => ({ ...prev, [convId]: count }));
  }, []);

  // Clique na notificação do browser → abre o chat na conversa correta
  const handleNotificationClick = useCallback((conversationId: string) => {
    setOpen(true);
    setUnreadMap((prev) => ({ ...prev, [conversationId]: 0 }));
    setTimeout(() => {
      const el = widgetContainerRef.current?.querySelector('chat-widget') as
        | (HTMLElement & { openConversation?: (id: string) => void })
        | null;
      el?.openConversation?.(conversationId);
    }, 80);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setUnreadMap({});
  };

  // Pedir permissão de notificação assim que o token estiver disponível
  useEffect(() => {
    if (!chatToken) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [chatToken]);

  // Nada a renderizar se o usuário ainda não está pronto
  if (!chatToken && !isLoading && !error) return null;

  return (
    <>
      {/* Botão flutuante — toggle abre/fecha */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={open ? t('chat.close', 'Fechar chat') : t('chat.openChat', 'Abrir chat')}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageSquare className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Loading / erro — só exibidos quando o painel está aberto */}
      {open && isLoading && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[380px] items-center justify-center overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {open && error && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[380px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border bg-background p-6 text-center shadow-2xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Widget SEMPRE montado quando token disponível — socket fica conectado mesmo com painel fechado */}
      {/* display:none esconde visualmente mas mantém React/socket ativos */}
      {chatToken && !isLoading && (
        <div
          ref={widgetContainerRef}
          className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
          style={{ display: open ? 'flex' : 'none' }}
          aria-hidden={!open}
        >
          <ChatWidget
            token={chatToken}
            serverUrl={serverUrl}
            tenantId={tenantId}
            locale={document.documentElement.lang || 'pt-BR'}
            onUnreadCountChange={handleUnread}
            onClose={() => setOpen(false)}
            onNotificationClick={handleNotificationClick}
            isVisible={open}
            style={{ flex: 1, minHeight: 0 }}
          />
        </div>
      )}
    </>
  );
}
