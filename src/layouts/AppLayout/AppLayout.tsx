import { useState, useEffect } from 'react';
import { matchPath, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChatFloating } from '@/features/chat/ChatFloating';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 }
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const isLearning = Boolean(
    matchPath('/t/:tenantSlug/app/learn/*', location.pathname) ||
    matchPath('/app/learn/*', location.pathname) ||
    matchPath('/t/:tenantSlug/app/lessons/*', location.pathname) ||
    matchPath('/app/lessons/*', location.pathname)
  );

  // Auto-collapse sidebar when entering learning mode
  useEffect(() => {
    if (isLearning) {
      setCollapsed(true);
    }
  }, [isLearning]);

  // Detect if we are in a simulator TERMINAL specifically
  // These routes need zero padding and no scroll for the terminal to fit
  const isTerminal = 
    (location.pathname.includes('/activity/') && !location.pathname.includes('/review')) || 
    (location.pathname.includes('/lab') && !location.pathname.endsWith('/lab') && !location.pathname.endsWith('/history'));

  return (
    <div className="flex h-screen min-h-screen bg-muted/30 overflow-hidden">
      {!isLearning && (
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
        />
      )}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 h-screen overflow-hidden ${isLearning ? '' : collapsed ? 'ml-16' : 'ml-64'}`}
      >
        {!isLearning && <Topbar onMenuClick={() => setCollapsed((c) => !c)} />}
        <main className="flex-1 flex flex-col overflow-hidden">
          {isLearning ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0 p-0 overflow-hidden">
              {outlet}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className={`flex-1 flex flex-col min-h-0 min-w-0 ${isTerminal ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto'}`}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
      <ChatFloating />
    </div>
  );
}
