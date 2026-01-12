
import React, { useState } from 'react';
import { Booking, Professional, Profile, Service } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  professionals: Professional[];
  onUpdateStatus: (id: string, status: string) => void;
}

type AdminSection = 'overview' | 'users' | 'partners' | 'services' | 'bookings' | 'payments' | 'content' | 'security' | 'notifications' | 'system';

// Mock data for internal admin state management
const INITIAL_USERS: Profile[] = [
  { id: 'u1', full_name: 'Amit Kumar', email: 'amit@example.com', role: 'customer', is_partner_approved: false },
  { id: 'u2', full_name: 'Sara Khan', email: 'sara@example.com', role: 'professional', is_partner_approved: true },
  { id: 'u3', full_name: 'John Doe', email: 'john@example.com', role: 'customer', is_partner_approved: false },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings: initialBookings, 
  professionals: initialProfessionals,
  onUpdateStatus
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [users, setUsers] = useState<Profile[]>(INITIAL_USERS);
  const [shops, setShops] = useState(initialProfessionals);
  const [adminBookings, setAdminBookings] = useState(initialBookings);
  const [priceVisibility, setPriceVisibility] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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

  // Logic Handlers
  const handleUserAction = (id: string, action: string) => {
    if (action === 'delete') {
      setUsers(users.filter(u => u.id !== id));
      alert(`User ${id} deleted permanently.`);
    } else if (action === 'verify') {
      alert(`User ${id} marked as verified.`);
    } else if (action === 'role') {
      alert(`Changing role for user ${id}...`);
    } else {
      alert(`Toggling status for user ${id}...`);
    }
  };

  const handleShopAction = (id: string, action: string) => {
    alert(`Performing ${action} on shop ${id}`);
  };

  const handleGlobalAction = (action: string) => {
    if (action === 'toggle-prices') {
      setPriceVisibility(!priceVisibility);
      alert(`Price visibility toggled to: ${!priceVisibility ? 'Hidden' : 'Visible'}`);
    } else if (action === 'maintenance') {
      setMaintenanceMode(!maintenanceMode);
      alert(`Maintenance mode is now ${!maintenanceMode ? 'ON' : 'OFF'}`);
    } else {
      alert(`Action Triggered: ${action}`);
    }
  };

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
                <ActionButton label="View Dashboard" variant="gold" onClick={() => handleGlobalAction('fetch-stats')} />
                <ActionButton label="Reports" onClick={() => handleGlobalAction('generate-report')} />
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
                  <ActionButton label="Location Analytics" onClick={() => handleGlobalAction('analytics-location')} />
                  <ActionButton label="Top Services" onClick={() => handleGlobalAction('analytics-services')} />
                  <ActionButton label="Peak Hours" onClick={() => handleGlobalAction('analytics-hours')} />
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <ActionButton label="View Users" variant="gold" onClick={() => handleGlobalAction('fetch-users')} />
                <ActionButton label="Verify All Pending" onClick={() => handleGlobalAction('verify-bulk')} />
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
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-8 py-6 font-bold uppercase tracking-tight">{user.full_name} ({user.email})</td>
                        <td className="px-8 py-6 text-xs text-white/40">{user.role}</td>
                        <td className="px-8 py-6 flex gap-2">
                          <ActionButton label="Toggle Status" onClick={() => handleUserAction(user.id, 'toggle')} />
                          <ActionButton label="Change Role" onClick={() => handleUserAction(user.id, 'role')} />
                          <ActionButton label="Verify" onClick={() => handleUserAction(user.id, 'verify')} />
                          <ActionButton label="Delete User" variant="danger" onClick={() => handleUserAction(user.id, 'delete')} />
                        </td>
                      </tr>
                    ))}
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
                        <ActionButton label="Approve" variant="gold" onClick={() => handleShopAction('pending-1', 'approve')} />
                        <ActionButton label="Reject" variant="danger" onClick={() => handleShopAction('pending-1', 'reject')} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="glass p-8 rounded-[2rem] border border-white/10">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Global Shop Management</h4>
                  <div className="flex flex-wrap gap-3">
                    <ActionButton label="Edit / Hide / Delete" onClick={() => handleGlobalAction('shop-edit-ui')} />
                    <ActionButton label="Edit Details" onClick={() => handleGlobalAction('shop-details-ui')} />
                    <ActionButton label="Feature" onClick={() => handleGlobalAction('shop-feature-ui')} />
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
                  <ActionButton label="Add Service" variant="gold" onClick={() => handleGlobalAction('service-add')} />
                  <ActionButton label="Add Category" onClick={() => handleGlobalAction('category-add')} />
                  <ActionButton label="Remove Service" variant="danger" onClick={() => handleGlobalAction('service-remove')} />
                </div>
              </div>
              <div className="pt-8 border-t border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Pricing Visibility Architecture</h4>
                <div className="flex flex-wrap gap-4">
                  <ActionButton label="Toggle Price Visibility" onClick={() => handleGlobalAction('toggle-prices')} />
                  <ActionButton label="Login View Price" onClick={() => handleGlobalAction('toggle-login-price')} />
                  <ActionButton label="Set Duration" onClick={() => handleGlobalAction('service-duration')} />
                </div>
              </div>
            </div>
          )}

          {/* Booking Control */}
          {activeSection === 'bookings' && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-6">
                <ActionButton label="View Bookings" variant="gold" onClick={() => handleGlobalAction('fetch-bookings')} />
                <ActionButton label="Analytics" onClick={() => handleGlobalAction('booking-stats')} />
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
                        <ActionButton label="Cancel" variant="danger" onClick={() => handleGlobalAction('booking-cancel-BK-9921')} />
                        <ActionButton label="Resolve Slot" onClick={() => handleGlobalAction('booking-resolve-BK-9921')} />
                        <ActionButton label="Block" onClick={() => handleGlobalAction('booking-block-BK-9921')} />
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
                  <ActionButton label="Gateway Status" onClick={() => handleGlobalAction('gateway-health')} />
                  <ActionButton label="Resolve Payment" onClick={() => handleGlobalAction('payment-dispute')} />
                  <ActionButton label="Revenue Report" variant="gold" onClick={() => handleGlobalAction('revenue-report')} />
                </div>
              </div>
              <div className="glass p-8 rounded-[2rem] border border-white/10">
                <h4 className="text-xs font-black uppercase tracking-widest mb-6">Partner Settlements</h4>
                <div className="flex flex-col gap-4">
                  <ActionButton label="Payouts" variant="gold" onClick={() => handleGlobalAction('payouts-run')} />
                  <ActionButton label="Set Commission" onClick={() => handleGlobalAction('commission-config')} />
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
                  <ActionButton label="Toggle Sections" onClick={() => handleGlobalAction('ui-sections-toggle')} />
                  <ActionButton label="Edit Text" onClick={() => handleGlobalAction('ui-text-edit')} />
                  <ActionButton label="Edit Footer" onClick={() => handleGlobalAction('ui-footer-edit')} />
                  <ActionButton label="Top 10 Control" variant="gold" onClick={() => handleGlobalAction('ui-top10-edit')} />
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
                        <ActionButton label="Force Logout" variant="danger" onClick={() => handleGlobalAction('security-logout-all')} />
                        <ActionButton label="Ban IP / User" variant="danger" onClick={() => handleGlobalAction('security-ban')} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Audit Trail</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Login Activity" onClick={() => handleGlobalAction('security-logs')} />
                        <ActionButton label="Access Rules" onClick={() => handleGlobalAction('security-acl')} />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'notifications' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Broadcast</p>
                      <ActionButton label="Announce" variant="gold" onClick={() => handleGlobalAction('notify-global')} />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Trigger Alerts</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Send Alert" onClick={() => handleGlobalAction('notify-custom')} />
                        <ActionButton label="Booking Alerts" onClick={() => handleGlobalAction('notify-booking')} />
                        <ActionButton label="Policy Alerts" onClick={() => handleGlobalAction('notify-policy')} />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === 'system' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Localization</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Currency" onClick={() => handleGlobalAction('system-currency')} />
                        <ActionButton label="Timezone" onClick={() => handleGlobalAction('system-timezone')} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Infrastructure</p>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="Maintenance" variant="danger" onClick={() => handleGlobalAction('maintenance')} />
                        <ActionButton label="Feature Flags" onClick={() => handleGlobalAction('system-flags')} />
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
