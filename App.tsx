import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.ts';
import { UserRole, Profile, Professional, Service, Category } from './types.ts';
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

const DECORATIVE_FOOTER_IMAGES = [
  "https://images.unsplash.com/photo-1512690196236-d5a23290393a?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80"
];

type AppView = 'home' | 'dashboard' | 'booking-flow' | 'partner' | 'login' | 'signup' | 'admin-panel';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedPartners, setApprovedPartners] = useState<Professional[]>([]);

  // Auth Rebuild States
  const [mobile, setMobile] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('customer');
  const [authType, setAuthType] = useState<'member' | 'admin'>('member');
  const [authStep, setAuthStep] = useState<'mobile' | 'otp'>('mobile');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedSession = localStorage.getItem('freshcut_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.id) {
            // Validate session with Supabase to ensure identity persistence
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', parsed.id)
              .maybeSingle();
            
            if (!error && data) {
              setProfile(data);
            } else {
              setProfile(parsed); // Fallback to local session if DB is unreachable
            }
          }
        }
        await fetchApprovedPartners();
      } catch (e) {
        console.error("Session recovery failed", e);
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
    if (!isLoading) {
      if (profile) {
        localStorage.setItem('freshcut_session', JSON.stringify(profile));
      } else {
        localStorage.removeItem('freshcut_session');
      }
    }
  }, [profile, isLoading]);

  const fetchApprovedPartners = async () => {
    try {
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
          status: p.status,
          trust_score: 95,
          owner_id: p.owner_id || ''
        }));
        setApprovedPartners(mapped);
      }
    } catch (e) { console.error(e); }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.trim().length < 10) return alert("Please enter a valid 10-digit mobile number.");
    setIsAuthLoading(true);
    setDevOtp(null);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();
      if (data.success) {
        setDevOtp(data.otp); // Dev mode OTP display
        setAuthStep('otp');
      } else {
        alert(data.error || "System failed to issue verification code.");
      }
    } catch (err) {
      alert("Authentication sync failure. Please check your internet connection.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 6) return alert("Complete the 6-digit verification hash.");
    setIsAuthLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otpInput }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Sync with Supabase profiles table
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('mobile', mobile)
          .maybeSingle();

        if (fetchError) throw fetchError;

        let finalProfile: Profile;

        if (existingProfile) {
          finalProfile = existingProfile;
        } else {
          // Signup logic: Create new profile entry
          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              full_name: fullName || (authRole === 'professional' ? 'Artisan Member' : 'Guest Member'),
              mobile: mobile,
              email: `${mobile}@freshcut.com`, // Required field placeholder
              role: authRole,
              status: authRole === 'professional' ? 'draft' : 'active',
              otp_verified: true,
              email_verified: false,
              pan_verified: false
            }])
            .select()
            .single();
          
          if (insertError) throw insertError;
          finalProfile = createdProfile;
        }

        setProfile(finalProfile);
        setCurrentView('dashboard');
        resetAuthFlow();
      } else {
        alert(data.error || "Verification failed. Hash mismatch.");
      }
    } catch (err: any) {
      console.error('Auth verification error:', err);
      alert(`Authentication failure: ${err.message || 'Identity could not be verified.'}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail.toLowerCase() === 'rhfarooqui16@gmail.com' && adminPassword === 'TheKing1278@') {
      const adminProfile: Profile = {
        id: 'admin-001',
        full_name: 'Marketplace Oracle',
        email: adminEmail,
        role: 'admin',
        status: 'active',
        otp_verified: true,
        email_verified: true,
        pan_verified: true
      };
      setProfile(adminProfile);
      setCurrentView('admin-panel');
      resetAuthFlow();
    } else {
      alert("Oracle Access Denied. Credentials Invalid.");
    }
  };

  const resetAuthFlow = () => {
    setAuthStep('mobile');
    setDevOtp(null);
    setMobile('');
    setOtpInput('');
    setFullName('');
    setAdminEmail('');
    setAdminPassword('');
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem('freshcut_session');
    setCurrentView('home');
    resetAuthFlow();
  };

  const handleViewChange = (view: string) => {
    const protectedViews = ['dashboard', 'admin-panel', 'booking-flow'];
    if (protectedViews.includes(view) && !profile) {
      setCurrentView('login');
      return;
    }
    if (view === 'admin-panel' && profile?.role !== 'admin') {
      setCurrentView('home');
      return;
    }
    setCurrentView(view as AppView);
  };

  const handleScroll = (id: string) => {
    setCurrentView('home');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (isLoading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

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
        {(currentView === 'login' || currentView === 'signup') && (
          <div className="min-h-screen pt-32 flex items-center justify-center p-4">
            <div className="glass p-12 rounded-[2.5rem] border border-white/10 w-full max-w-md animate-fadeIn shadow-2xl relative">
              <div className="flex justify-center gap-4 mb-10 border-b border-white/5 pb-6">
                <button onClick={() => setAuthType('member')} className={`text-[10px] font-black uppercase tracking-widest transition-all pb-2 border-b-2 ${authType === 'member' ? 'border-gold text-gold' : 'border-transparent text-white/20 hover:text-white'}`}>Member Portal</button>
                <button onClick={() => setAuthType('admin')} className={`text-[10px] font-black uppercase tracking-widest transition-all pb-2 border-b-2 ${authType === 'admin' ? 'border-gold text-gold' : 'border-transparent text-white/20 hover:text-white'}`}>Oracle Admin</button>
              </div>

              <h2 className="text-4xl font-serif font-black mb-8 text-center text-gold uppercase tracking-tighter">
                {authType === 'admin' ? 'Terminal Auth' : (currentView === 'login' ? 'Welcome Back' : 'Create Identity')}
              </h2>
              
              {authType === 'member' ? (
                <form onSubmit={authStep === 'otp' ? handleVerifyOtp : handleRequestOtp} className="space-y-6">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4">
                    <button type="button" onClick={() => setAuthRole('customer')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'customer' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Customer</button>
                    <button type="button" onClick={() => setAuthRole('professional')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'professional' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Artisan</button>
                  </div>

                  {authStep === 'mobile' && (
                    <>
                      {currentView === 'signup' && (
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" placeholder="Legal Full Name" required />
                      )}
                      <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" placeholder="Mobile Number" required />
                      <button type="submit" disabled={isAuthLoading} className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all transform active:scale-95">
                        {isAuthLoading ? 'Connecting...' : 'Issue OTP'}
                      </button>
                    </>
                  )}

                  {authStep === 'otp' && (
                    <div className="space-y-6 animate-slideUp">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">Protocol sent to {mobile}</p>
                      <input type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full bg-white/5 border border-gold/50 rounded-2xl px-6 py-5 text-center text-2xl font-black tracking-[0.6em] text-gold outline-none" placeholder="XXXXXX" required />
                      <button type="submit" disabled={isAuthLoading} className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light">
                        {isAuthLoading ? 'Authenticating...' : 'Establish Session'}
                      </button>
                      <button type="button" onClick={() => { setAuthStep('mobile'); setDevOtp(null); }} className="w-full text-[9px] text-white/20 uppercase tracking-widest hover:text-white">Back to Mobile</button>
                    </div>
                  )}
                  
                  <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <button type="button" onClick={() => { setCurrentView(currentView === 'login' ? 'signup' : 'login'); resetAuthFlow(); }} className="text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors">
                      {currentView === 'login' ? 'Register New Identity' : 'Existing Member Entry'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-6 animate-fadeIn">
                  <div className="space-y-4">
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" placeholder="Oracle Email" required />
                    <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold transition-all" placeholder="Terminal Key" required />
                    <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all transform active:scale-95">Authorize Oracle</button>
                  </div>
                </form>
              )}
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
            
            <section id="services" className="py-32 px-4 bg-dark-900">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                  <h2 className="text-gold text-[10px] font-black tracking-[0.6em] uppercase mb-4">Service Protocol Showcase</h2>
                  <h3 className="text-5xl font-serif font-black gold-gradient uppercase">Curation Suites</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {MOCK_SERVICES.map(service => (
                    <div key={service.id} className="glass p-10 rounded-[2.5rem] border border-white/5 group hover:border-gold/30 transition-all">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-4">{service.category} suite</span>
                      <h4 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">{service.name}</h4>
                      <p className="text-[10px] text-white/40 mb-8 uppercase tracking-widest">{service.duration_mins} MIN SESSION</p>
                      
                      <div className="flex justify-between items-end mt-4">
                        {profile ? (
                          <span className="text-lg font-black text-gold tracking-tighter">₹{service.price}</span>
                        ) : (
                          <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Sign in for pricing</span>
                        )}
                        <button onClick={() => handleViewChange('booking-flow')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-dark-900 transition-all text-xl">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        )}

        {currentView === 'dashboard' && profile && <Dashboard role={profile.role} bookings={[]} />}
        {currentView === 'admin-panel' && profile?.role === 'admin' && <AdminPanel bookings={[]} professionals={approvedPartners} onUpdateStatus={() => {}} />}
        {currentView === 'partner' && <PartnerPage profile={profile} onSubmit={() => handleViewChange('home')} />}
        {currentView === 'booking-flow' && <BookingPage type="gents" professionals={approvedPartners.filter(p => p.is_online)} services={MOCK_SERVICES} onSubmit={() => handleViewChange('dashboard')} onBack={() => handleViewChange('home')} />}
      </div>

      {devOtp && (
        <div className="fixed bottom-6 right-6 z-[999] glass p-6 rounded-2xl border border-gold/50 shadow-2xl animate-slideUp">
          <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-2">Dev OTP Oracle</p>
          <p className="text-3xl font-black text-white tracking-[0.3em]">{devOtp}</p>
        </div>
      )}

      <footer className="bg-dark-900 border-t border-white/10 pt-32 pb-16 px-4 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-serif font-black gold-gradient mb-8 tracking-tighter">FRESH CUT</h2>
            <p className="text-white/40 max-w-md leading-loose text-sm uppercase tracking-widest font-black text-[10px] mb-12">
              Providing a premium unisex artisan marketplace experience since 1994. Our architectural booking engine connects high-tier specialists with discerning clientele through uber-style demand fulfillment.
            </p>
            <div className="flex gap-4">
              {DECORATIVE_FOOTER_IMAGES.map((img, idx) => (
                <div key={idx} className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={img} alt="Artisan Craft" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-gold text-[10px] font-black tracking-widest uppercase mb-8">Quick Links</h4>
            <div className="flex flex-col space-y-4">
              <button onClick={() => handleViewChange('home')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Architectural Home</button>
              <button onClick={() => handleScroll('services')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Price & Services</button>
              <button onClick={() => handleViewChange('partner')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Become a Partner</button>
              <button onClick={() => handleViewChange('dashboard')} className="text-left text-[10px] font-black text-white/40 hover:text-gold transition-colors uppercase tracking-widest">Member Dashboard</button>
            </div>
          </div>
          <div>
            <h4 className="text-gold text-[10px] font-black tracking-widest uppercase mb-8">Support</h4>
            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-2">Direct Inquiries</p>
            <p className="text-white/70 text-[10px] font-black tracking-widest uppercase mb-8">rhfarooqui16@gmail.com</p>
            <div className="flex space-x-6">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold transition-all text-[10px] text-white/40 hover:text-gold cursor-pointer font-black uppercase tracking-widest">IG</div>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold transition-all text-[10px] text-white/40 hover:text-gold cursor-pointer font-black uppercase tracking-widest">TW</div>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold transition-all text-[10px] text-white/40 hover:text-gold cursor-pointer font-black uppercase tracking-widest">LI</div>
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
