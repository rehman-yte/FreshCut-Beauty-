
import React from 'react';
import { UserRole } from '../types';

interface NavbarProps {
  userRole?: UserRole;
  onLogout: () => void;
  onAuthOpen: () => void;
  onViewChange: (view: 'home' | 'dashboard') => void;
  currentView: 'home' | 'dashboard';
}

export const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout, onAuthOpen, onViewChange, currentView }) => {
  const handleServiceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentView !== 'home') {
      onViewChange('home');
      setTimeout(() => {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePartnerClick = () => {
    alert("Join our elite network of artisans. Please send your portfolio and professional credentials to partner@freshcut.in. Our talent acquisition team will reach out within 48 hours.");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <button 
              onClick={() => onViewChange('home')}
              className="text-2xl font-serif font-black tracking-tighter gold-gradient"
            >
              FRESH CUT & BEAUTY
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onViewChange('home')}
              className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-gold ${currentView === 'home' ? 'text-gold' : 'text-white/60'}`}
            >
              HOME
            </button>
            <a 
              href="#services" 
              onClick={handleServiceClick}
              className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-gold text-white/60`}
            >
              SERVICE
            </a>
            <button 
              onClick={() => onViewChange('dashboard')}
              className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-gold ${currentView === 'dashboard' ? 'text-gold' : 'text-white/60'}`}
            >
              DASHBOARD
            </button>
            <button 
              onClick={handlePartnerClick}
              className="text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-gold text-white/60"
            >
              PARTNER
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {userRole ? (
              <button 
                onClick={onLogout}
                className="px-6 py-2 border border-gold/30 text-gold text-[10px] font-black tracking-widest rounded-full hover:bg-gold hover:text-dark-900 transition-all duration-500 uppercase"
              >
                LOGOUT
              </button>
            ) : (
              <button 
                onClick={onAuthOpen}
                className="px-8 py-2.5 bg-gold text-dark-900 text-[10px] font-black tracking-widest rounded-full hover:bg-gold-light transform hover:scale-105 transition-all duration-300 shadow-lg shadow-gold/20 uppercase"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
