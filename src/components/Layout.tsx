import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Settings, 
  Moon, 
  Sun,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { migrateOldInvoice } from '../utils/migration';
import { motion, AnimatePresence } from 'framer-motion';
import { TitleBar } from './TitleBar';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme, setCurrentInvoice } = useInvoiceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const cleanup = window.electron.onFileOpen((data: any) => {
      console.log('File opened from OS:', data);
      const migratedData = migrateOldInvoice(data.content);
      setCurrentInvoice(migratedData);
      navigate('/editor');
    });
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [setCurrentInvoice, navigate]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FilePlus, label: 'New Invoice', path: '/editor' },
    { icon: History, label: 'Invoice History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="relative flex flex-col border-r border-border glass bg-card/50 backdrop-blur-xl z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="font-bold text-xl tracking-tight text-primary-600 dark:text-primary-400"
              >
                PEIPL BILL
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            const handleClick = (e: React.MouseEvent) => {
              if (item.path === '/editor') {
                e.preventDefault();
                setCurrentInvoice(null);
                navigate('/editor');
              }
            };

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
              <item.icon size={22} className={cn(
                "transition-transform group-hover:scale-110",
                location.pathname === item.path && "text-primary-500"
              )} />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-primary-500 rounded-full"
                />
              )}
            </Link>
          )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-accent transition-all group"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            {isSidebarOpen && (
              <span className="font-medium">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto scroll-smooth bg-slate-50/50 dark:bg-slate-950/50">
        <header className="sticky top-0 z-10 glass-card mx-6 mt-6 p-4 rounded-2xl flex items-center justify-between border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</span>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Overview</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Profile/Quick Actions */}
             <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs">
               PE
             </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-100px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
};
