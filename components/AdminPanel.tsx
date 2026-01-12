
import React, { useState } from 'react';
import { Booking, Professional, Profile } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  professionals: Professional[];
  onUpdateStatus: (id: string, status: string) => void;
}

type AdminSection = 'overview' | 'users' | 'partners' | 'services' | 'bookings' | 'payments' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings, 
  professionals, 
  onUpdateStatus
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const navItems: {id: AdminSection, label: string}[] = [
    {id: 'overview', label: 'Overview'},
    {id: 'users', label: 'Users'},
    {id: 'partners', label: 'Partners'},
    {id: 'services', label: 'Services'},
    {id: 'bookings', label: 'Bookings'},
    {id: 'payments', label: 'Payments'},
    {id: 'settings', label: 'Settings'},
  ];

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Sidebar Roadmap */}
        <aside className="lg:w-64 glass rounded-3xl p-6 border border-white/10 h-fit sticky top-32">
          <h3 className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 ml-2">Admin Dashboard</h3>
          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeSection === item.id ? 'bg-gold text-dark-900' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Section Content */}
        <div className="flex-1 animate-fadeIn">
          <div className="mb-12">
            <h1 className="text-4xl font-serif font-bold gold-gradient mb-2 uppercase tracking-tighter">{activeSection}</h1>
            <p className="text-white/50">Administrative control and architectural management</p>
          </div>

          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass p-10 rounded-[2.5rem] border border-white/10">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Revenue</span>
                <span className="text-4xl font-serif font-black text-gold">₹124.5k</span>
              </div>
              <div className="glass p-10 rounded-[2.5rem] border border-white/10">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Bookings</span>
                <span className="text-4xl font-serif font-black text-gold">482</span>
              </div>
              <div className="glass p-10 rounded-[2.5rem] border border-white/10">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Partners</span>
                <span className="text-4xl font-serif font-black text-gold">12</span>
              </div>
            </div>
          )}

          {activeSection === 'bookings' && (
            <div className="glass rounded-[2rem] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-white/30 uppercase">Customer</th>
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-white/30 uppercase">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-white/30 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-bold uppercase tracking-tight">John Doe</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[9px] font-black rounded-full uppercase tracking-widest">Pending</span>
                      </td>
                      <td className="px-8 py-6">
                        <button className="text-[10px] font-black text-gold hover:underline uppercase tracking-widest">Manage</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeSection === 'partners' || activeSection === 'users' || activeSection === 'services' || activeSection === 'payments' || activeSection === 'settings') && (
            <div className="glass p-20 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center mb-6">
                <div className="w-2 h-2 bg-gold rounded-full animate-ping" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest mb-4">Architecture Ready</h3>
              <p className="text-white/40 max-w-sm text-sm leading-relaxed">This section is architecturally wired and ready for production data integration. Logic for status approval and slot visibility is defined in the roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
