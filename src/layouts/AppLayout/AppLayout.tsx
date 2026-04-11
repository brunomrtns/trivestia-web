import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChatFloating } from '@/features/chat/ChatFloating';
import { useUIStore } from '@/stores/ui.store';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 }
};

export function AppLayout() {
  const { sidebarCollapsed: collapsed } = useUIStore();
  const location = useLocation();
  const outlet = useOutlet();

  // Detect if we are in a simulator TERMINAL specifically
  // These routes need zero padding and no scroll for the terminal to fit
  const isTerminal =
    (location.pathname.includes('/activity/') &&
      !location.pathname.includes('/review')) ||
    (location.pathname.includes('/lab') &&
      !location.pathname.endsWith('/lab') &&
      !location.pathname.endsWith('/history'));

  return (
    <div className="flex h-screen min-h-screen bg-muted/30 overflow-hidden">
      {/* {!isLearning && <Sidebar />} */}
      <Sidebar />
      <div
        className={`flex flex-1 flex-col transition-all duration-200 h-screen overflow-hidden ${collapsed ? 'ml-16' : 'ml-64'}`}
      >
        {/* {!isLearning && <Topbar />} */}
        <Topbar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
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
        </main>
      </div>
      <ChatFloating />
    </div>
  );
}
