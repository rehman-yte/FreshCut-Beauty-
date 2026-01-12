
import React from 'react';
import { UserRole } from '../types';

interface NavbarProps {
  userRole?: UserRole;
  onLogout: () => void;
  onAuthOpen: () => void;
  onViewChange: (view: string) => void;
  currentView: 'home' | 'dashboard';
}

export const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout, onAuthOpen, onViewChange, currentView }) => {
  const handleScroll = (id: string) => {
    onViewChange('home');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-20">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        <button onClick={() => onViewChange('home')} className="text-2xl font-serif font-black tracking-tighter gold-gradient">
          FRESH CUT
        </button>

        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onViewChange('home')} className={`text-[10px] font-black tracking-widest uppercase ${currentView === 'home' ? 'text-gold' : 'text-white/60'}`}>Home</button>
          <button onClick={() => handleScroll('services')} className="text-[10px] font-black tracking-widest uppercase text-white/60 hover:text-gold transition-all">Services</button>
          <button onClick={() => onViewChange('dashboard')} className={`text-[10px] font-black tracking-widest uppercase ${currentView === 'dashboard' ? 'text-gold' : 'text-white/60'}`}>Dashboard</button>
          <button onClick={() => onViewChange('partner')} className="text-[10px] font-black tracking-widest uppercase text-white/60 hover:text-gold transition-all">Partner With Us</button>
        </div>

        <div className="flex items-center space-x-4">
          {userRole ? (
            <button onClick={onLogout} className="px-6 py-2 border border-gold/30 text-gold text-[10px] font-black rounded-full hover:bg-gold hover:text-dark-900 transition-all">LOGOUT</button>
          ) : (
            <button onClick={onAuthOpen} className="px-8 py-2.5 bg-gold text-dark-900 text-[10px] font-black rounded-full hover:bg-gold-light transition-all shadow-lg shadow-gold/20">SIGN IN</button>
          )}
        </div>
      </div>
    </nav>
  );
};
