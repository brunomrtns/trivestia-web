import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SuperSidebar } from './SuperSidebar';
import { SuperTopbar } from './SuperTopbar';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 }
};

export function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <SuperSidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed((c) => !c)}
      />
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-64'}`}
      >
        <SuperTopbar onMenuClick={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-x-hidden p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
