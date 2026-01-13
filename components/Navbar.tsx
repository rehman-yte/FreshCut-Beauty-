import React from 'react';
import { UserRole } from '../types.ts';

interface NavbarProps {
  userRole?: UserRole;
  onLogout: () => void;
  onAuthOpen: () => void;
  onViewChange: (view: string) => void;
  currentView: string;
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
          <button onClick={() => onViewChange('home')} className={`text-[10px] font-black tracking-widest uppercase transition-all hover:text-gold ${currentView === 'home' ? 'text-gold' : 'text-white/60'}`}>Home</button>
          <button onClick={() => handleScroll('services')} className="text-[10px] font-black tracking-widest uppercase text-white/60 hover:text-gold transition-all">Price</button>
          <button onClick={() => onViewChange(userRole === 'admin' ? 'admin-panel' : 'dashboard')} className={`text-[10px] font-black tracking-widest uppercase transition-all hover:text-gold ${currentView === 'dashboard' || currentView === 'admin-panel' ? 'text-gold' : 'text-white/60'}`}>Dashboard</button>
          <button onClick={() => onViewChange('partner')} className={`text-[10px] font-black tracking-widest uppercase transition-all hover:text-gold ${currentView === 'partner' ? 'text-gold' : 'text-white/60'}`}>Become a Partner</button>
        </div>

        <div className="flex items-center space-x-4">
          {userRole === 'admin' && (
            <button 
              onClick={() => onViewChange('admin-panel')} 
              className="px-8 py-2.5 bg-gold text-dark-900 text-[10px] font-black rounded-full hover:bg-gold-light transform hover:scale-105 transition-all duration-300 shadow-lg shadow-gold/20 uppercase"
            >
              ADMIN PANEL
            </button>
          )}
          
          {userRole ? (
            <button onClick={onLogout} className="px-6 py-2 border border-gold/30 text-gold text-[10px] font-black rounded-full hover:bg-gold hover:text-dark-900 transition-all duration-500 uppercase">LOGOUT</button>
          ) : (
            <button onClick={onAuthOpen} className="px-8 py-2.5 bg-gold text-dark-900 text-[10px] font-black rounded-full hover:bg-gold-light transform hover:scale-105 transition-all duration-300 shadow-lg shadow-gold/20 uppercase">SIGN IN</button>
          )}
        </div>
      </div>
    </nav>
  );
};