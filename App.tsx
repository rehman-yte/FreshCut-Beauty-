
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole, Profile, Professional, Service, Category } from './types';
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
    const initTimer = setTimeout(() => setIsLoading(false), 300);
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    
    fetchApprovedPartners();
    
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const fetchApprovedPartners = async () => {
    // VISIBILITY RULE: Only fetch partners with status 'approved'
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'approved');

    if (!error && data) {
      const mappedPartners: Professional[] = data.map((p: any) => ({
        id: p.id,
        name: p.shop_name,
        bio: p.services,
        image_url: p.category === 'gents' 
          ? 'https://images.unsplash.com/photo-1605497746444-ac961d1349a2?auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80',
        specialties: p.services.split(','),
        category: p.category
      }));
      setApprovedPartners(mappedPartners);
    }
  };

  const handleAuth = (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    const isAdmin = email === 'rhfarooqui16@gmail.com' && password === 'TheKing1278@';
    
    setProfile({
      id: isAdmin ? 'admin-001' : 'user-' + Date.now(),
      full_name: fullName || (isAdmin ? 'Chief Admin' : 'Valued Client'),
      email: email,
      role: isAdmin ? 'admin' : 'customer'
    });
    
    setCurrentView(isAdmin ? 'admin-panel' : 'dashboard');
  };

  const handleBookingComplete = (data: any) => {
    if (!profile) {
      setCurrentView('login');
    } else {
      setCurrentView('payment-mockup');
    }
  };

  const handleViewChange = (view: string) => {
    const protectedViews = ['dashboard', 'admin-panel', 'payment-mockup'];
    if (protectedViews.includes(view) && !profile) {
      setCurrentView('login');
    } else {
      setCurrentView(view as AppView);
      if (view === 'home') {
        fetchApprovedPartners();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <h1 className="text-gold text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">Initializing Studio...</h1>
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
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Welcome Back</h2>
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
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Join The Studio</h2>
            <form onSubmit={(e) => handleAuth(e, 'signup')} className="space-y-6">
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Full Name" required />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Password" required />
              <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all">Create Account</button>
            </form>
            <button onClick={() => setCurrentView('login')} className="w-full mt-6 text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors">Already a member? Sign In</button>
          </div>
        </div>
      )}

      {currentView === 'admin-panel' && profile && (
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
          professionals={approvedPartners} 
          services={MOCK_SERVICES} 
          onSubmit={handleBookingComplete}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'payment-mockup' && profile && (
        <div className="min-h-screen pt-32 pb-20 px-4 flex justify-center">
          <div className="max-w-2xl w-full animate-fadeIn">
            <h2 className="text-4xl font-serif font-black gold-gradient mb-12 text-center uppercase">Secure Checkout</h2>
            <div className="glass rounded-[2.5rem] p-12 border border-gold/30">
              <div className="mb-8 border-b border-white/10 pb-8">
                <h3 className="text-sm font-black tracking-widest uppercase text-white/40 mb-4">Summary</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Elite Grooming Session</span>
                  <span className="font-serif font-bold text-gold">₹999</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Studio Fee</span>
                  <span className="font-serif font-bold text-gold">₹49</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold mt-4">
                  <span>Total Amount</span>
                  <span className="gold-gradient">₹1,048</span>
                </div>
              </div>
              <button onClick={() => handleViewChange('dashboard')} className="w-full py-6 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase transform hover:scale-[1.02] transition-all">Confirm & Pay</button>
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
              <span className="inline-block text-gold text-xs font-black tracking-[0.4em] uppercase mb-6">Established 1994 &bull; Luxury Grooming</span>
              <h1 className="text-6xl md:text-9xl font-serif font-black mb-8 leading-tight">Timeless.<br/><span className="gold-gradient italic">Artistry.</span></h1>
              <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">The ultimate unisex destination for elite grooming. From Gents Master Barbering to Ladies Premium Beauty Treatments.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button onClick={() => setCurrentView('booking-flow')} className="w-full sm:w-auto px-12 py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-full hover:bg-gold-light transition-all shadow-xl shadow-gold/20 uppercase">RESERVE SLOT</button>
                <button onClick={() => { document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full sm:w-auto px-12 py-5 border border-white/20 hover:border-gold rounded-full text-xs font-black tracking-widest transition-all hover:text-gold uppercase text-center">VIEW SERVICES</button>
              </div>
            </div>
          </section>

          <section id="services" className="py-32 bg-dark-800 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-20">
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Signature Collections</span>
                <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Services & Styling</h2>
                <div className="h-1 w-20 bg-gold mx-auto rounded-full" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {['gents', 'ladies'].map((cat) => (
                  <div key={cat}>
                    <h3 className="text-2xl font-serif font-bold text-gold mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">
                      {cat === 'gents' ? 'Gents Barber Services' : 'Ladies Beauty Parlour Services'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {MOCK_SERVICES.filter(s => s.category === cat).map(s => (
                        <div key={s.id} className="glass p-8 rounded-[2rem] border border-white/10 flex flex-col justify-between cursor-default">
                          <div>
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter transition-colors pointer-events-none">{s.name}</h4>
                            <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-6 pointer-events-none">{s.duration_mins} MIN SESSION</p>
                          </div>
                          <div className="flex justify-between items-center">
                            {/* VISIBILITY RULE: Prices hidden unless user is logged in */}
                            <span className={`text-2xl font-serif font-black gold-gradient transition-opacity duration-300 ${!profile ? 'invisible' : 'visible'}`}>
                              {profile ? `₹${s.price}` : '---'}
                            </span>
                            <button onClick={() => setCurrentView('booking-flow')} className="text-[9px] font-black text-white/40 hover:text-gold uppercase tracking-widest">Reserve Slot</button>
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
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Artisan Excellence</span>
                <h3 className="text-3xl font-serif font-bold uppercase tracking-tight">Showcase</h3>
                <div className="h-px w-12 bg-gold/30 mx-auto mt-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {approvedPartners.length > 0 ? (
                  approvedPartners.slice(0, 3).map(p => (
                    <div key={p.id} className="glass p-4 rounded-[2rem] border border-white/10 overflow-hidden transform hover:scale-[1.02] transition-all">
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full aspect-[4/5] object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700" 
                      />
                      <div className="mt-6 text-center">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gold">{p.name}</p>
                        <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1">{p.category === 'gents' ? 'Barber' : 'Beauty Studio'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center">
                    <p className="text-white/20 text-xs uppercase tracking-widest italic">Awaiting approved artisan submissions...</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="py-24 bg-dark-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-4xl font-serif font-black gold-gradient mb-12 block">FRESH CUT</span>
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-[11px] font-black tracking-widest uppercase text-white/40">
            <button onClick={() => handleViewChange('home')} className="hover:text-gold transition-all">Home</button>
            <button onClick={() => { handleViewChange('home'); setTimeout(() => document.getElementById('services')?.scrollIntoView({behavior:'smooth'}), 100); }} className="hover:text-gold transition-all">Services</button>
            <button onClick={() => handleViewChange('dashboard')} className="hover:text-gold transition-all">Dashboard</button>
            <button onClick={() => handleViewChange('partner')} className="hover:text-gold transition-all">Partner With Us</button>
          </div>
          <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">&copy; 2024 Fresh Cut Studio. Luxury Grooming Experience.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
