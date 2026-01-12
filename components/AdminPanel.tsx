
import React, { useState } from 'react';
import { Booking, Professional, Profile } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  professionals: Professional[];
  onUpdateStatus: (id: string, status: string) => void;
}

type AdminSection = 'overview' | 'users' | 'partners' | 'services' | 'bookings' | 'payments' | 'content' | 'security' | 'notifications' | 'system';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings, 
  professionals, 
  onUpdateStatus
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const navItems: {id: AdminSection, label: string}[] = [
    {id: 'overview', label: 'Dashboard'},
    {id: 'users', label: 'User Management'},
    {id: 'partners', label: 'Shops & Partners'},
    {id: 'services', label: 'Services & Pricing'},
    {id: 'bookings', label: 'Booking Control'},
    {id: 'payments', label: 'Payments & Payouts'},
    {id: 'content', label: 'Content Control'},
    {id: 'security', label: 'Security & Auth'},
    {id: 'notifications', label: 'Communication'},
    {id: 'system', label: 'System Settings'},
  ];

  const ActionButton = ({ label, onClick, variant = 'outline' }: { label: string, onClick?: () => void, variant?: 'gold' | 'outline' | 'danger' }) => {
    const baseStyles = "px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all";
    const variants = {
      gold: "bg-gold text-dark-900 hover:bg-gold-light",
      outline: "border border-white/10 text-white/60 hover:border-gold hover:text-gold",
      danger: "border border-red-500/30 text-red-500 hover:bg-red-500/10"
    };
    return (
      <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-72 glass rounded-[2.5rem] p-6 border border-white/10 h-fit sticky top-32">
          <h3 className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-8 ml-2">Studio Oversight</h3>
          <nav className="space-y-1.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeSection === item.id ? 'bg-gold text-dark-900' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 animate-fadeIn">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif font-black gold-gradient mb-2 uppercase tracking-tighter">{activeSection.replace('-', ' ')}</h1>
              <p className="text-white/40 text-xs font-medium tracking-wide">Architectural control panel & global state management</p>
            </div>
            {activeSection === 'overview' && (
              <div className="flex gap-3">
                <ActionButton label="View Dashboard" variant="gold" />
                <ActionButton label="Reports" />
              </div>
            )}
          </div>

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Revenue', value: '₹124.5k', trend: '+12%' },
                  { label: 'Total Bookings', value: '482', trend: '+5%' },
                  { label: 'Active Partners', value: '12', trend: 'Stable' },
                ].map((stat, i) => (
                  <div key={i} className="glass p-8 rounded-[2rem] border border-white/10">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">{stat.label}</span>
                    <span className="text-3xl font-serif font-black text-gold block mb-4">{stat.value}</span>
                    <span className="text-[9px] font-bold text-gold/60 uppercase tracking-widest">{stat.trend} this month</span>
                  </div>
                ))}
              </div>
              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Real-time Analytics Controls</h4>
                <div className="flex flex-wrap gap-4">
                  <ActionButton label="Location Analytics" />
                  <ActionButton label="Top Services" />
                  <ActionButton label="Peak Hours" />
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <ActionButton label="View Users" variant="gold" />
                <ActionButton label="Verify All Pending" />
              </div>
              <div className="glass rounded-[2rem] border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">User Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Role</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-8 py-6 font-bold uppercase tracking-tight">amit_kumar_92</td>
                      <td className="px-8 py-6 text-xs text-white/40">Customer</td>
                      <td className="px-8 py-6 flex gap-2">
                        <ActionButton label="Toggle Status" />
                        <ActionButton label="Change Role" />
                        <ActionButton label="Verify" />
                        <ActionButton label="Delete User" variant="danger" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shops & Partners */}
          {activeSection === 'partners' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-[2rem] border border-white/10">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-6">New Shop Requests</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-[11px] font-bold uppercase tracking-tighter">The Royal Shave</span>
                      <div className="flex gap-2">
                        <ActionButton label="Approve" variant="gold" />
                        <ActionButton label="Reject" variant="danger" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="glass p-8 rounded-[2rem] border border-white/10">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Global Shop Management</h4>
                  <div className="flex flex-wrap gap-3">
                    <ActionButton label="Edit / Hide / Delete" />
                    <ActionButton label="Edit Details" />
                    <ActionButton label="Feature" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services & Pricing */}
          {activeSection === 'services' && (
            <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-8">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Service Inventory Controls</h4>
                <div className="flex flex-wrap gap-4">
                  <ActionButton label="Add Service" variant="gold" />
                  <ActionButton label="Add Category" />
                  <ActionButton label="Remove Service" variant="danger" />
                </div>
              </div>
              <div className="pt-8 border-t border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Pricing Visibility Architecture</h4>
                <div className="flex flex-wrap gap-4">
                  <ActionButton label="Toggle Price Visibility" />
                  <ActionButton label="Login View Price" />
                  <ActionButton label="Set Duration" />
                </div>
              </div>
            </div>
          )}

          {/* Booking Control */}
          {activeSection === 'bookings' && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-6">
                <ActionButton label="View Bookings" variant="gold" />
                <ActionButton label="Analytics" />
              </div>
              <div className="glass rounded-[2rem] border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Session ID</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Conflict Status</th>
                      <th className="px-8 py-5 text-[10px] font-black tracking-widest text-white/30 uppercase">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-8 py-6 text-xs text-white/60 font-mono">#BK-9921</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black rounded-full uppercase tracking-widest">Normal</span>
                      </td>
                      <td className="px-8 py-6 flex gap-2">
                        <ActionButton label="Cancel" variant="danger" />
                        <ActionButton label="Resolve Slot" />
                        <ActionButton label="Block" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments & Payouts */}
          {activeSection === 'payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Financial Gateway</h4>
                <div className="flex flex-col gap-4">
                  <ActionButton label="Gateway Status" />
                  <ActionButton label="Resolve Payment" />
                  <ActionButton label="Revenue Report" variant="gold" />
                </div>
              </div>
              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Partner Settlements</h4>
                <div className="flex flex-col gap-4">
                  <ActionButton label="Payouts" variant="gold" />
                  <ActionButton label="Set Commission" />
                </div>
              </div>
            </div>
          )}

          {/* Content Control */}
          {activeSection === 'content' && (
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-10">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Front Page Sections</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ActionButton label="Toggle Sections" />
                  <ActionButton label="Edit Text" />
                  <ActionButton label="Edit Footer" />
                  <ActionButton label="Top 10 Control" variant="gold" />
                </div>
              </div>
            </div>
          )}

          {/* Security & System Sections (Combined Mockup for visibility) */}
          {(activeSection === 'security' || activeSection === 'notifications' || activeSection === 'system') && (
            <div className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-8 animate-fadeIn">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest">Global State Controls</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeSection === 'security' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Auth Protocol</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Force Logout" variant="danger" />
                        <ActionButton label="Ban IP / User" variant="danger" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Audit Trail</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Login Activity" />
                        <ActionButton label="Access Rules" />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'notifications' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Broadcast</p>
                      <ActionButton label="Announce" variant="gold" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Trigger Alerts</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Send Alert" />
                        <ActionButton label="Booking Alerts" />
                        <ActionButton label="Policy Alerts" />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'system' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Localization</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Currency" />
                        <ActionButton label="Timezone" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Infrastructure</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Maintenance" variant="danger" />
                        <ActionButton label="Feature Flags" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
