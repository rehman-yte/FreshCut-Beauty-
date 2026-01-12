
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole, Profile, Professional, Service, Category, Booking } from './types';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';
import { PartnerPage } from './components/PartnerPage';

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Executive Gents Cut', category: 'gents', price: 999, duration_mins: 45 },
  { id: '2', name: 'Ladies Couture Styling', category: 'ladies', price: 1499, duration_mins: 60 },
  { id: '3', name: 'Signature Beard Sculpt', category: 'gents', price: 499, duration_mins: 30 },
  { id: '4', name: 'Luxe Glow Facial', category: 'ladies', price: 2499, duration_mins: 90 },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80"
];

type AppView = 'home' | 'dashboard' | 'booking-flow' | 'partner' | 'login' | 'signup' | 'admin-panel' | 'payment-mockup';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedPartners, setApprovedPartners] = useState<Professional[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const initApp = async () => {
      try {
        await fetchApprovedPartners();
      } finally {
        setIsLoading(false);
      }
    };
    initApp();

    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchApprovedPartners = async () => {
    // SYSTEM RULE: Only 'approved' partners are fetched for public display
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'approved');

    if (!error && data) {
      const mapped: Professional[] = data.map((p: any) => ({
        id: p.id,
        name: p.shop_name,
        bio: p.services,
        image_url: p.category === 'gents' 
          ? 'https://images.unsplash.com/photo-1605497746444-ac961d1349a2?auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80',
        specialties: p.services.split(','),
        category: p.category,
        is_online: p.is_online ?? true,
        location_city: p.city
      }));
      setApprovedPartners(mapped);
    }
  };

  const logActivity = async (type: string, message: string, refId: string = '') => {
    // CENTRAL ACTIVITY LOG: Every action creates a notification for Admin oversight
    try {
      await supabase.from('notifications').insert([{
        type,
        message,
        reference_id: refId,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn('Logging error:', e);
    }
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    const isAdmin = email === 'rhfarooqui16@gmail.com' && password === 'TheKing1278@';
    
    const newProfile: Profile = {
      id: isAdmin ? 'admin-001' : 'user-' + Date.now(),
      full_name: fullName || (isAdmin ? 'Chief Admin' : 'Valued Client'),
      email: email,
      role: isAdmin ? 'admin' : 'customer'
    };

    setProfile(newProfile);
    
    if (type === 'signup') {
      await logActivity('user_signup', `New registration: ${newProfile.full_name}`, newProfile.id);
    } else {
      await logActivity('user_login', `${newProfile.full_name} authenticated`, newProfile.id);
    }
    
    setCurrentView(isAdmin ? 'admin-panel' : 'dashboard');
  };

  const handleBookingComplete = async (bookingData: any) => {
    if (!profile) {
      setCurrentView('login');
      return;
    }

    try {
      // SLOT FORMATTING & DOUBLE BOOKING PREVENTION
      // Ensure date and time are provided
      if (!bookingData.date || !bookingData.time) {
        alert('Invalid slot format. Please select both date and time.');
        return;
      }

      const appointmentTime = `${bookingData.date}T${bookingData.time}:00Z`;
      
      // If professional is pre-selected (optional in Uber-style), check for conflicts
      if (bookingData.professionalId) {
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('professional_id', bookingData.professionalId)
          .eq('appointment_time', appointmentTime)
          .neq('status', 'cancelled');

        if (existingBookings && existingBookings.length > 0) {
          alert('Slot Conflict: This time slot is no longer available. Please select another time.');
          return;
        }
      }

      const bookingId = 'bk-' + Date.now();
      const { error } = await supabase.from('bookings').insert([{
        id: bookingId,
        customer_id: profile.id,
        professional_id: bookingData.professionalId || null, // Can be null in Uber-style until matched
        service_id: bookingData.serviceId,
        appointment_time: appointmentTime,
        status: 'searching', // Initial marketplace state
        created_at: new Date().toISOString()
      }]);

      if (!error) {
        await logActivity('booking_created', `New booking created by ${profile.full_name}`, bookingId);
        setCurrentView('payment-mockup');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setCurrentView('dashboard');
    }
  };

  const handleViewChange = (view: string) => {
    const protectedViews = ['dashboard', 'admin-panel', 'payment-mockup'];
    if (protectedViews.includes(view) && !profile) {
      setCurrentView('login');
    } else {
      setCurrentView(view as AppView);
      if (view === 'home') fetchApprovedPartners();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <h1 className="text-gold text-[10px] font-black tracking-[0.5em] uppercase animate-pulse mb-6">Synchronizing Studio...</h1>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gold animate-[progress_2s_infinite_linear]" style={{width: '30%'}} />
        </div>
        <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-gold selection:text-dark-900">
      <Navbar 
        userRole={profile?.role} 
        onLogout={() => { setProfile(null); setCurrentView('home'); fetchApprovedPartners(); }} 
        onAuthOpen={() => setCurrentView('login')}
        currentView={currentView === 'dashboard' || currentView === 'admin-panel' ? 'dashboard' : 'home'}
        onViewChange={handleViewChange}
      />

      {currentView === 'login' && (
        <div className="min-h-screen pt-32 flex items-center justify-center p-4">
          <div className="glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md animate-fadeIn">
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Marketplace Login</h2>
            <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-6">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Password" required />
              <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all">Sign In</button>
            </form>
            <button onClick={() => setCurrentView('signup')} className="w-full mt-6 text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors">New to Fresh Cut? Create Account</button>
          </div>
        </div>
      )}

      {currentView === 'signup' && (
        <div className="min-h-screen pt-32 flex items-center justify-center p-4">
          <div className="glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md animate-fadeIn">
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Registration</h2>
            <form onSubmit={(e) => handleAuth(e, 'signup')} className="space-y-6">
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Full Name" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Password" required />
              <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all">Join Marketplace</button>
            </form>
            <button onClick={() => setCurrentView('login')} className="w-full mt-6 text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors">Already registered? Login</button>
          </div>
        </div>
      )}

      {currentView === 'admin-panel' && profile?.role === 'admin' && (
        <AdminPanel 
          bookings={[]} 
          professionals={approvedPartners} 
          onUpdateStatus={() => {}} 
        />
      )}

      {currentView === 'dashboard' && profile && (
        <Dashboard role={profile.role} bookings={[]} />
      )}

      {currentView === 'partner' && (
        <PartnerPage onSubmit={() => { setCurrentView('home'); fetchApprovedPartners(); }} />
      )}

      {currentView === 'booking-flow' && (
        <BookingPage 
          type="gents" 
          professionals={approvedPartners.filter(p => p.is_online)} 
          services={MOCK_SERVICES} 
          onSubmit={handleBookingComplete}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'payment-mockup' && (
        <div className="min-h-screen pt-32 pb-20 px-4 flex justify-center">
          <div className="max-w-2xl w-full animate-fadeIn">
            <h2 className="text-4xl font-serif font-black gold-gradient mb-12 text-center uppercase">Confirm Payment</h2>
            <div className="glass rounded-[2.5rem] p-12 border border-gold/30">
              <div className="mb-8 border-b border-white/10 pb-8">
                <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-4">Marketplace Summary</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Elite Grooming Reservation</span>
                  <span className="font-serif font-bold text-gold">₹999</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Platform Processing Fee</span>
                  <span className="font-serif font-bold text-gold">₹49</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold mt-4">
                  <span>Total Payable</span>
                  <span className="gold-gradient">₹1,048</span>
                </div>
              </div>
              <button onClick={() => { logActivity('booking_confirmed', `Payment confirmed by ${profile?.full_name}`, 'pay-' + Date.now()); handleViewChange('dashboard'); }} className="w-full py-6 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-xl shadow-gold/20 hover:scale-[1.02] transition-all">Complete Transaction</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'home' && (
        <main className="animate-fadeIn">
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              {HERO_IMAGES.map((img, idx) => (
                <img key={img} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${heroImageIndex === idx ? 'opacity-40' : 'opacity-0'}`} alt="Background" />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900" />
            </div>
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <span className="inline-block text-gold text-xs font-black tracking-[0.4em] uppercase mb-6">Uber-Style Artisan Matching &bull; Est. 1994</span>
              <h1 className="text-6xl md:text-9xl font-serif font-black mb-8 leading-tight">Master.<br/><span className="gold-gradient italic">Artisans.</span></h1>
              <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">The ultimate decentralized destination for elite grooming. Instant matching with Master Barbers & Beauty Specialists.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button onClick={() => handleViewChange('booking-flow')} className="w-full sm:w-auto px-12 py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-full hover:bg-gold-light transition-all shadow-xl shadow-gold/20 uppercase">RESERVE SLOT</button>
                <button onClick={() => { document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full sm:w-auto px-12 py-5 border border-white/20 hover:border-gold rounded-full text-xs font-black tracking-widest transition-all hover:text-gold uppercase text-center">VIEW PORTFOLIO</button>
              </div>
            </div>
          </section>

          <section id="services" className="py-32 bg-dark-800 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-20">
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Demand Signals</span>
                <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Studio Offerings</h2>
                <div className="h-1 w-20 bg-gold mx-auto rounded-full" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {['gents', 'ladies'].map((cat) => (
                  <div key={cat}>
                    <h3 className="text-2xl font-serif font-bold text-gold mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">
                      {cat === 'gents' ? 'Artisan Barbering' : 'Couture Beauty Studio'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {MOCK_SERVICES.filter(s => s.category === cat).map(s => (
                        <div key={s.id} className="glass p-8 rounded-[2rem] border border-white/10 flex flex-col justify-between cursor-default group hover:border-gold/30 transition-all">
                          <div>
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter transition-colors group-hover:text-gold">{s.name}</h4>
                            <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-6">{s.duration_mins} MINS</p>
                          </div>
                          <div className="flex justify-between items-center">
                            {/* VISIBILITY RULE: Prices hidden until login */}
                            <span className={`text-2xl font-serif font-black gold-gradient transition-opacity duration-300 ${!profile ? 'invisible opacity-0' : 'visible opacity-100'}`}>
                              {profile ? `₹${s.price}` : ''}
                            </span>
                            <button onClick={() => handleViewChange('booking-flow')} className="text-[9px] font-black text-white/40 hover:text-gold uppercase tracking-widest transition-colors">Select</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-32 bg-dark-800">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Supply Status</span>
                <h3 className="text-3xl font-serif font-bold uppercase tracking-tight">Verified Professionals</h3>
                <div className="h-px w-12 bg-gold/30 mx-auto mt-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {approvedPartners.length > 0 ? (
                  approvedPartners.slice(0, 3).map(p => (
                    <div key={p.id} className="glass p-4 rounded-[2rem] border border-white/10 overflow-hidden group">
                      <div className="relative overflow-hidden rounded-2xl">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full aspect-[4/5] object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                        />
                        {p.is_online && (
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-gold/30 backdrop-blur-md">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">Live</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gold mb-1">{p.name}</p>
                        <p className="text-[8px] text-white/40 uppercase tracking-widest">{p.location_city || 'Central Hub'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center glass rounded-[2.5rem] border border-white/5">
                    <p className="text-white/20 text-xs uppercase tracking-widest italic animate-pulse">Scanning for active supply signals...</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="py-24 bg-dark-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-4xl font-serif font-black gold-gradient mb-12 block tracking-tighter">FRESH CUT</span>
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-[11px] font-black tracking-widest uppercase text-white/40">
            <button onClick={() => handleViewChange('home')} className="hover:text-gold transition-all">Home</button>
            <button onClick={() => { handleViewChange('home'); setTimeout(() => document.getElementById('services')?.scrollIntoView({behavior:'smooth'}), 100); }} className="hover:text-gold transition-all">Services</button>
            <button onClick={() => handleViewChange('dashboard')} className="hover:text-gold transition-all">Dashboard</button>
            <button onClick={() => handleViewChange('partner')} className="hover:text-gold transition-all">Partner Network</button>
          </div>
          <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">&copy; 2024 Fresh Cut Studio. Luxury Marketplace Ecosystem.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
