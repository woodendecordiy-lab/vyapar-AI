import { NavLink, Outlet } from 'react-router-dom';
import { Calculator, ScanLine, LayoutDashboard, LogOut, Menu, X, FileAudio, BookOpen, CreditCard, Lock, LogIn } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logout } from '../firebase';
import PremiumModal from './PremiumModal';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, isSubscribed } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', isPro: false },
    { to: '/calculator', icon: Calculator, label: 'Voice Calculator', isPro: false },
    { to: '/scanner', icon: ScanLine, label: 'Bill Scanner', isPro: true },
    { to: '/generator', icon: FileAudio, label: 'Voice to Bill', isPro: true },
    { to: '/khata', icon: BookOpen, label: 'Khata Book', isPro: true },
    { to: '/subscription', icon: CreditCard, label: 'Pro Subscription', isPro: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-xl font-bold text-blue-600">Vyapar AI</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-blue-600">Vyapar AI</h1>
          <p className="text-xs text-gray-500 mt-1">Smart Business Assistant</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isLocked = item.isPro && !isSubscribed;
            return (
              <motion.div key={item.to} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <NavLink
                  to={isLocked ? '#' : item.to}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      setShowPremiumModal(true);
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={({ isActive }) => cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive && !isLocked
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet context={{ requirePremium: () => setShowPremiumModal(true) }} />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
