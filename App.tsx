
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole, Profile, Professional, Service, Booking, Category } from './types';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';
import { PartnerPage } from './components/PartnerPage';

const MOCK_PROFESSIONALS: Professional[] = [
  { id: '1', name: 'Master Lorenzo', category: 'gents', bio: 'Senior Master Barber with 15 years experience in precision gents grooming.', image_url: 'https://images.unsplash.com/photo-1605497746444-ac961d1349a2?auto=format&fit=crop&q=80', specialties: ['Precision Cut', 'Beard'] },
  { id: '2', name: 'Isabella Thorne', category: 'ladies', bio: 'Premier Stylist specializing in ladies couture styling and luxury bridal transformations.', image_url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80', specialties: ['Styling', 'Color'] },
  { id: '3', name: 'Sophie Vane', category: 'ladies', bio: 'Aesthetics expert focused on high-end skin treatments and professional makeup.', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80', specialties: ['Facial', 'Makeup'] },
];

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

type AppView = 'home' | 'dashboard' | 'booking-selection' | 'booking-flow' | 'partner';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_PROFESSIONALS);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // Auth State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) fetchProfile(initialSession.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setCurrentView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) fetchBookings();
  }, [profile]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data);
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async () => {
    if (!profile) return;
    try {
      let query = supabase.from('bookings').select('*, professional:professional_id(*), service:service_id(*), customer:customer_id(*)');
      if (profile.role === 'customer') query = query.eq('customer_id', profile.id);
      const { data } = await query.order('appointment_time', { ascending: false });
      if (data) setBookings(data as any);
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { data: authData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (authData.user) {
          await supabase.from('profiles').insert([{ id: authData.user.id, full_name: fullName, email, role: 'customer' }]);
        }
        alert("Success! Please sign in.");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsAuthModalOpen(false);
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleBookingSubmit = async (data: any) => {
    if (!profile) { setIsAuthModalOpen(true); return; }
    
    // Check for double booking locally (simplified)
    const appointmentTime = `${data.date} ${data.time}`;
    const isConflict = bookings.some(b => b.professional_id === data.professionalId && b.appointment_time === appointmentTime);
    if (isConflict) { alert("This slot is already taken by another customer. Please choose a different time."); return; }

    try {
      const { data: bData, error } = await supabase.from('bookings').insert([{
        customer_id: profile.id, professional_id: data.professionalId, service_id: data.serviceId, appointment_time: appointmentTime, status: 'pending'
      }]).select('*, professional:professional_id(*), service:service_id(*), customer:customer_id(*)').single();

      if (error) throw error;
      setBookings([bData as any, ...bookings]);
      alert('Confirmed! Check your dashboard.');
      setCurrentView('dashboard');
    } catch (err: any) { alert(err.message); }
  };

  const gentsServices = services.filter(s => s.category === 'gents');
  const ladiesServices = services.filter(s => s.category === 'ladies');

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-gold selection:text-dark-900">
      <Navbar 
        userRole={profile?.role} 
        onLogout={() => supabase.auth.signOut()} 
        onAuthOpen={() => setIsAuthModalOpen(true)}
        currentView={currentView === 'dashboard' ? 'dashboard' : 'home'}
        onViewChange={(view) => setCurrentView(view as AppView)}
      />

      {currentView === 'dashboard' && profile ? (
        profile.role === 'admin' ? (
          <AdminPanel bookings={bookings} professionals={professionals} onUpdateStatus={() => fetchBookings()} />
        ) : (
          <Dashboard role={profile.role} bookings={bookings} />
        )
      ) : currentView === 'partner' ? (
        <PartnerPage onSubmit={() => { alert("Application sent!"); setCurrentView('home'); }} />
      ) : currentView === 'booking-selection' ? (
        <div className="min-h-screen pt-32 flex flex-col items-center">
           <h2 className="text-4xl font-serif font-black gold-gradient mb-12 text-center uppercase tracking-tighter">Choose Your Category</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4">
              <button onClick={() => { setSelectedCategory('gents'); setCurrentView('booking-flow'); }} className="glass p-12 rounded-[2.5rem] border border-white/10 hover:border-gold transition-all text-center">
                <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Gents Barber</h3>
                <p className="text-white/40">Signature grooming for men.</p>
              </button>
              <button onClick={() => { setSelectedCategory('ladies'); setCurrentView('booking-flow'); }} className="glass p-12 rounded-[2.5rem] border border-white/10 hover:border-gold transition-all text-center">
                <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Ladies Parlour</h3>
                <p className="text-white/40">Luxury aesthetic care for women.</p>
              </button>
           </div>
        </div>
      ) : currentView === 'booking-flow' ? (
        <BookingPage 
          type={selectedCategory || 'gents'} 
          professionals={professionals.filter(p => p.category === selectedCategory)} 
          services={services.filter(s => s.category === selectedCategory)} 
          onSubmit={handleBookingSubmit}
          onBack={() => setCurrentView('booking-selection')}
        />
      ) : (
        <main className="animate-fadeIn">
          {/* HERO SECTION */}
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
                <button onClick={() => setCurrentView('booking-selection')} className="w-full sm:w-auto px-12 py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-full hover:bg-gold-light transition-all shadow-xl shadow-gold/20 uppercase">RESERVE SLOT</button>
                <a href="#services" className="w-full sm:w-auto px-12 py-5 border border-white/20 hover:border-gold rounded-full text-xs font-black tracking-widest transition-all hover:text-gold uppercase text-center">VIEW SERVICES</a>
              </div>
            </div>
          </section>

          {/* SERVICES SECTION */}
          <section id="services" className="py-32 bg-dark-800 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-20">
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Signature Collections</span>
                <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Services & Styling</h2>
                <div className="h-1 w-20 bg-gold mx-auto rounded-full" />
              </div>

              <div className="mb-20">
                <h3 className="text-2xl font-serif font-bold text-gold mb-8 uppercase tracking-widest">Gents Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {gentsServices.map(s => (
                    <div key={s.id} className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/30 transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter group-hover:text-gold transition-colors">{s.name}</h4>
                        <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-6">{s.duration_mins} MIN SESSION</p>
                      </div>
                      <span className="text-3xl font-serif font-black gold-gradient">₹{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-serif font-bold text-gold mb-8 uppercase tracking-widest">Ladies Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {ladiesServices.map(s => (
                    <div key={s.id} className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/30 transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="text-xl font-bold mb-2 uppercase tracking-tighter group-hover:text-gold transition-colors">{s.name}</h4>
                        <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-6">{s.duration_mins} MIN SESSION</p>
                      </div>
                      <span className="text-3xl font-serif font-black gold-gradient">₹{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PROFESSIONALS SECTION */}
          <section id="experts" className="py-32 bg-dark-900">
            <div className="max-w-7xl mx-auto px-4 text-center mb-20">
              <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">The Artisans</span>
              <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Our Master Professionals</h2>
            </div>
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
              {professionals.map((p) => (
                <div key={p.id} className="relative group">
                  <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 transition-all duration-700">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="absolute bottom-10 left-10 right-10">
                    <h3 className="text-3xl font-serif font-bold mb-2 uppercase tracking-tighter group-hover:text-gold transition-colors">{p.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.specialties.map(s => <span key={s} className="text-[9px] font-black tracking-widest uppercase text-gold bg-gold/5 px-3 py-1 rounded-full border border-gold/20">{s}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsAuthModalOpen(false)} />
          <div className="relative glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md">
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">{isSignup ? 'Join The Studio' : 'Welcome Back'}</h2>
            <form onSubmit={handleAuth} className="space-y-6">
              {isSignup && <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Full Name" required />}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Password" required />
              <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl"> {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
            </form>
            <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-6 text-[10px] text-white/40 uppercase tracking-widest">{isSignup ? 'Already a member? Sign In' : 'New? Join Now'}</button>
          </div>
        </div>
      )}

      <footer className="py-24 bg-dark-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-4xl font-serif font-black gold-gradient mb-12 block">FRESH CUT</span>
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-[11px] font-black tracking-widest uppercase text-white/40">
            <button onClick={() => setCurrentView('home')}>Home</button>
            <a href="#services">Services</a>
            <button onClick={() => profile ? setCurrentView('dashboard') : setIsAuthModalOpen(true)}>Dashboard</button>
            <button onClick={() => setCurrentView('partner')}>Partner With Us</button>
          </div>
          <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">&copy; 2024 Fresh Cut Studio. Luxury Grooming Experience.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
