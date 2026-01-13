import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase.ts';
import { UserRole, Profile, Professional, Service, Category, Booking } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { BookingPage } from './components/BookingPage.tsx';
import { PartnerPage } from './components/PartnerPage.tsx';

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

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80"
];

type AppView = 'home' | 'dashboard' | 'booking-flow' | 'partner' | 'login' | 'signup' | 'admin-panel' | 'payment-mockup' | 'admin-login';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedPartners, setApprovedPartners] = useState<Professional[]>([]);

  // Auth States
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('customer');
  
  // OTP Popup State
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const otpInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedProfile = localStorage.getItem('freshcut_session');
        const savedView = localStorage.getItem('freshcut_view_state');
        
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile(parsed);
          if (savedView && savedView !== 'login' && savedView !== 'signup' && savedView !== 'admin-login') {
            setCurrentView(savedView as AppView);
          }
        }
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

  useEffect(() => {
    let interval: any;
    if (showOtpPopup && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpPopup, timer]);

  useEffect(() => {
    if (!isLoading) {
      if (profile) localStorage.setItem('freshcut_session', JSON.stringify(profile));
      else localStorage.removeItem('freshcut_session');
      localStorage.setItem('freshcut_view_state', currentView);
    }
  }, [profile, currentView, isLoading]);

  const fetchApprovedPartners = async () => {
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
        location_city: p.city,
        status: p.status,
        trust_score: 95,
        owner_id: p.owner_id || ''
      }));
      setApprovedPartners(mapped);
    }
  };

  const initiateAuth = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    
    // Simulate mobile verification initiation
    const userData = {
      id: 'usr-' + Date.now(),
      full_name: fullName || (type === 'login' ? 'Returning Member' : 'Artisan Member'),
      mobile: mobile,
      email: email || `${mobile}@freshcut.com`,
      role: authRole,
      status: authRole === 'professional' && type === 'signup' ? 'draft' : 'active',
      otp_verified: false,
      email_verified: false,
      pan_verified: false
    };

    setPendingUser(userData);
    setShowOtpPopup(true);
    setTimer(60);
    setOtpValue(['', '', '', '', '', '']);
    
    // Send log to admin
    await supabase.from('notifications').insert([{
      type: 'auth_attempt',
      actor_role: authRole,
      message: `New ${type} attempt for mobile ${mobile}. OTP challenged.`,
      is_read: false
    }]);
  };

  const verifyOtp = async () => {
    const code = otpValue.join('');
    if (code === '123456' || code === '000000') { // Master demo codes
      const verifiedUser = { ...pendingUser, otp_verified: true };
      setProfile(verifiedUser);
      setShowOtpPopup(false);
      setCurrentView('dashboard');
      
      await supabase.from('notifications').insert([{
        type: 'auth_success',
        actor_role: verifiedUser.role,
        message: `${verifiedUser.full_name} (${verifiedUser.role}) authorized via OTP. Session established.`,
        is_read: false
      }]);
    } else {
      alert("Invalid OTP Protocol. Please retry.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValue];
    newOtp[index] = value.slice(-1);
    setOtpValue(newOtp);
    if (value && index < 5) otpInputRefs[index + 1].current?.focus();
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem('freshcut_session');
    localStorage.removeItem('freshcut_view_state');
    setCurrentView('home');
  };

  const handleViewChange = (view: string) => {
    const protectedViews = ['dashboard', 'admin-panel', 'payment-mockup', 'booking-flow'];
    if (protectedViews.includes(view) && !profile) {
      setCurrentView('login');
    } else {
      if (view === 'admin-panel' && profile?.role !== 'admin') return;
      setCurrentView(view as AppView);
      if (view === 'home') fetchApprovedPartners();
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-gold selection:text-dark-900 flex flex-col">
      <Navbar 
        userRole={profile?.role} 
        onLogout={handleLogout} 
        onAuthOpen={() => setCurrentView('login')}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="flex-grow">
        {currentView === 'login' && (
          <div className="min-h-screen pt-32 flex items-center justify-center p-4">
            <div className="glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md animate-fadeIn">
              <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Member Login</h2>
              <form onSubmit={(e) => initiateAuth(e, 'login')} className="space-y-6">
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4">
                  <button type="button" onClick={() => setAuthRole('customer')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'customer' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Customer</button>
                  <button type="button" onClick={() => setAuthRole('professional')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'professional' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Professional</button>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black">+91</span>
                  <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-gold" placeholder="Mobile Number" required />
                </div>
                <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all">Request OTP</button>
              </form>
              <button onClick={() => setCurrentView('signup')} className="w-full mt-6 text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors text-center">New Application</button>
            </div>
          </div>
        )}

        {currentView === 'signup' && (
          <div className="min-h-screen pt-32 flex items-center justify-center p-4">
            <div className="glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md animate-fadeIn">
              <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Registration</h2>
              <form onSubmit={(e) => initiateAuth(e, 'signup')} className="space-y-6">
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4">
                  <button type="button" onClick={() => setAuthRole('customer')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'customer' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Customer</button>
                  <button type="button" onClick={() => setAuthRole('professional')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'professional' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Professional</button>
                </div>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Full Name" required />
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black">+91</span>
                  <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-gold" placeholder="Mobile Number" required />
                </div>
                <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20">Establish Registry</button>
              </form>
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
                <h1 className="text-6xl md:text-9xl font-serif font-black mb-8 leading-tight">Master.<br/><span className="gold-gradient italic">Artistry.</span></h1>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <button onClick={() => handleViewChange('booking-flow')} className="w-full sm:w-auto px-12 py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-full hover:bg-gold-light transition-all shadow-xl shadow-gold/20 uppercase">RESERVE SLOT</button>
                  <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-12 py-5 border border-white/20 text-white text-xs font-black tracking-widest rounded-full hover:bg-white/5 transition-all uppercase">VIEW SERVICES</button>
                </div>
              </div>
            </section>

            <section className="py-24 px-4 bg-dark-900/50">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  {GALLERY_IMAGES.map((img, idx) => (
                    <div key={idx} className="aspect-square relative overflow-hidden rounded-3xl border border-white/10 group">
                      <img src={img} alt="Showcase" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="services" className="py-32 px-4 bg-dark-900">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                  <h2 className="text-gold text-[10px] font-black tracking-[0.6em] uppercase mb-4">Service Protocol Showcase</h2>
                  <h3 className="text-5xl font-serif font-black gold-gradient uppercase">Artist Defined Pricing</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {MOCK_SERVICES.map(service => (
                    <div key={service.id} className="glass p-10 rounded-[2.5rem] border border-white/5 group hover:border-gold/30 transition-all">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-4">{service.category} suite</span>
                      <h4 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">{service.name}</h4>
                      <p className="text-[10px] text-white/40 mb-8 uppercase tracking-widest">{service.duration_mins} MIN SESSION</p>
                      <div className="flex justify-end mt-4">
                        <button onClick={() => handleViewChange('booking-flow')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-dark-900 transition-all text-xl">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        )}

        {currentView === 'dashboard' && profile && (
          <Dashboard role={profile.role} bookings={[]} />
        )}

        {currentView === 'admin-panel' && profile?.role === 'admin' && (
          <AdminPanel bookings={[]} professionals={approvedPartners} onUpdateStatus={() => {}} />
        )}

        {currentView === 'partner' && (
          <PartnerPage onSubmit={() => { handleViewChange('home'); }} />
        )}

        {currentView === 'booking-flow' && (
          <BookingPage type="gents" professionals={approvedPartners.filter(p => p.is_online)} services={MOCK_SERVICES} onSubmit={() => handleViewChange('dashboard')} onBack={() => handleViewChange('home')} />
        )}
      </div>

      {/* MEDO AI STYLE OTP POPUP (BOTTOM-RIGHT) */}
      {showOtpPopup && (
        <div className="fixed bottom-8 right-8 z-[100] w-80 glass p-8 rounded-[2rem] border border-gold/30 shadow-2xl animate-slideUp">
          <h3 className="text-gold text-[10px] font-black uppercase tracking-[0.4em] mb-6">Security Challenge</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6 leading-relaxed">System sent verification payload to +91 {mobile}. Enter 6-digit hash.</p>
          <div className="flex justify-between gap-2 mb-8">
            {otpValue.map((digit, i) => (
              <input key={i} ref={otpInputRefs[i]} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => e.key === 'Backspace' && !digit && i > 0 && otpInputRefs[i - 1].current?.focus()} className="w-10 h-12 bg-white/5 border border-white/10 rounded-xl text-center font-bold text-gold focus:border-gold outline-none" />
            ))}
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-white/20">00:{timer < 10 ? `0${timer}` : timer}</span>
            <button disabled={timer > 0} className="text-[10px] font-black uppercase text-gold/40 hover:text-gold disabled:opacity-30 transition-all">Resend OTP</button>
          </div>
          <button onClick={verifyOtp} className="w-full py-4 bg-gold text-dark-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gold-light transition-all">Verify Session</button>
          <button onClick={() => setShowOtpPopup(false)} className="w-full mt-3 text-[9px] text-white/20 uppercase tracking-widest hover:text-white transition-all">Cancel Authorization</button>
        </div>
      )}

      <footer className="bg-dark-900 border-t border-white/10 pt-32 pb-16 px-4 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-serif font-black gold-gradient mb-8 tracking-tighter">FRESH CUT</h2>
            <p className="text-white/40 max-w-md leading-loose text-sm uppercase tracking-widest font-black text-[10px]">Providing a premium unisex artisan marketplace experience since 1994. Our architectural booking engine connects high-tier specialists with discerning clientele through uber-style demand fulfillment.</p>
          </div>
          <div>
            <h4 className="text-gold text-[10px] font-black tracking-widest uppercase mb-8">Quick Links</h4>
            <div className="flex flex-col space-y-4">
              <button onClick={() => handleViewChange('home')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Architectural Home</button>
              <button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Price & Services</button>
              <button onClick={() => handleViewChange('partner')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Partner With Us</button>
            </div>
          </div>
          <div>
            <h4 className="text-gold text-[10px] font-black tracking-widest uppercase mb-8">Support</h4>
            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-2">General Inquiries</p>
            <p className="text-white/70 text-[10px] font-black tracking-widest uppercase mb-6">rhfarooqui16@gmail.com</p>
            <div className="flex space-x-6">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold transition-all text-xs text-white/40 hover:text-gold cursor-pointer uppercase font-black">IG</div>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold transition-all text-xs text-white/40 hover:text-gold cursor-pointer uppercase font-black">TW</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 border-t border-white/5 text-center">
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.6em]">&copy; 2024 FRESH CUT BEAUTY ARCHITECTURE. ALL PROTOCOLS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;