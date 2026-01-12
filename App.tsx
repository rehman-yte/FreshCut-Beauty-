
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole, Profile, Barber, Service, Booking } from './types';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { Dashboard } from './components/Dashboard';
import { BookingPage } from './components/BookingPage';

/**
 * DEVELOPMENT ROADMAP
 * 
 * Phase 1: 
 * - Defined 'gents-booking' and 'ladies-booking' view states.
 * - Mapped existing MOCK_BARBERS and MOCK_SERVICES to specific categories.
 * 
 * Phase 2:
 * - Implemented slot booking logic (Date -> Time -> Confirm).
 * - Integrated Supabase insertion for permanent records.
 * - Maintained "Reserve" button as the primary entry point to choice selection.
 * 
 * Phase 3:
 * - Dashboard visibility for new bookings.
 * - Admin control for status updates.
 */

const MOCK_BARBERS: Barber[] = [
  { id: '1', name: 'Master Lorenzo', bio: 'Senior Master Barber with 15 years experience in precision gents grooming and classic hot towels.', image_url: 'https://images.unsplash.com/photo-1605497746444-ac961d1349a2?auto=format&fit=crop&q=80', specialties: ['Precision Cut', 'Beard'] },
  { id: '2', name: 'Isabella Thorne', bio: 'Premier Stylist and Creative Director specializing in ladies couture styling and luxury bridal transformations.', image_url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80', specialties: ['Styling', 'Color'] },
  { id: '3', name: 'Sophie Vane', bio: 'Aesthetics expert focused on high-end skin treatments, revitalizing facials, and professional makeup artistry.', image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80', specialties: ['Facial', 'Makeup'] },
];

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Executive Gents Cut', price: 999, duration_mins: 45 },
  { id: '2', name: 'Ladies Couture Styling', price: 1499, duration_mins: 60 },
  { id: '3', name: 'Signature Beard Sculpt', price: 499, duration_mins: 30 },
  { id: '4', name: 'Luxe Glow Facial', price: 2499, duration_mins: 90 },
];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80", // Gents
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80"  // Ladies
];

type AppView = 'home' | 'dashboard' | 'booking-selection' | 'gents-booking' | 'ladies-booking';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>(MOCK_BARBERS);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  // Auth Form State
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

    fetchInitialData();
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

  const fetchInitialData = async () => {
    try {
      const { data: barberData } = await supabase.from('barbers').select('*');
      if (barberData && barberData.length > 0) setBarbers(barberData);

      const { data: serviceData } = await supabase.from('services').select('*');
      if (serviceData && serviceData.length > 0) setServices(serviceData);
    } catch (err) {
      console.warn("Using mock data as database tables are not ready.");
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchBookings = async () => {
    if (!profile) return;
    try {
      let query = supabase.from('bookings').select(`
        *,
        barber:barber_id(*),
        service:service_id(*),
        customer:customer_id(*)
      `);

      if (profile.role === 'customer') {
        query = query.eq('customer_id', profile.id);
      } else if (profile.role === 'barber') {
        query = query.eq('barber_id', profile.id);
      }

      const { data, error } = await query.order('appointment_time', { ascending: false });
      if (data) setBookings(data as any);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (authError) throw authError;
        
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
              id: authData.user.id, 
              full_name: fullName, 
              email: email, 
              role: 'customer' 
            }]);
          if (profileError) console.error("Profile creation error:", profileError);
        }
        alert("Account created! Please sign in.");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentView('home');
  };

  const handleBookingSubmit = async (data: any) => {
    if (!profile) {
      setIsAuthModalOpen(true);
      return;
    }
    
    const appointmentTime = `${data.date} ${data.time}`;
    try {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert([{
          customer_id: profile.id,
          barber_id: data.barberId,
          service_id: data.serviceId,
          appointment_time: appointmentTime,
          status: 'pending'
        }])
        .select(`
          *,
          barber:barber_id(*),
          service:service_id(*),
          customer:customer_id(*)
        `)
        .single();

      if (error) throw error;
      if (bookingData) {
        setBookings([bookingData as any, ...bookings]);
        alert('Booking confirmed! We will see you soon.');
        setCurrentView('dashboard');
      }
    } catch (err: any) {
      alert("Booking failed: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  const handleCreateBarber = async (data: Partial<Barber>) => {
    try {
      const { data: newBarber, error } = await supabase
        .from('barbers')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      if (newBarber) setBarbers([...barbers, newBarber]);
    } catch (err: any) {
      const mockNew = { id: Math.random().toString(), ...data } as Barber;
      setBarbers([...barbers, mockNew]);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    try {
      const { error } = await supabase.from('barbers').delete().eq('id', id);
      if (error) throw error;
      setBarbers(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      setBarbers(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDashboardLink = () => {
    if (profile) {
      setCurrentView('dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  if (loading && !session) {
    return (
      <div className="h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-gold font-serif text-2xl animate-pulse tracking-widest">LOADING EXPERIENCE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-gold selection:text-dark-900">
      <Navbar 
        userRole={profile?.role} 
        onLogout={handleSignOut} 
        onAuthOpen={() => setIsAuthModalOpen(true)}
        currentView={currentView === 'dashboard' ? 'dashboard' : 'home'}
        onViewChange={(view) => {
          if (view === 'dashboard') {
            handleDashboardLink();
          } else {
            setCurrentView(view as AppView);
          }
        }}
      />

      {currentView === 'dashboard' && profile ? (
        profile.role === 'admin' ? (
          <AdminPanel 
            bookings={bookings} 
            barbers={barbers} 
            customers={[]}
            onUpdateStatus={handleUpdateStatus}
            onDeleteBarber={handleDeleteBarber}
            onCreateBarber={handleCreateBarber}
          />
        ) : (
          <Dashboard 
            role={profile.role} 
            bookings={bookings} 
            onUpdateStatus={profile.role === 'barber' ? handleUpdateStatus : undefined}
          />
        )
      ) : currentView === 'booking-selection' ? (
        <main className="pt-32 pb-20 px-4 animate-fadeIn flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-4xl font-serif font-black gold-gradient mb-12 text-center uppercase tracking-tighter">Choose Your Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button 
              onClick={() => setCurrentView('gents-booking')}
              className="glass p-12 rounded-[2rem] border border-white/10 hover:border-gold group transition-all duration-500 text-center"
            >
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <svg className="w-10 h-10 text-gold group-hover:text-dark-900" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Gents Barber</h3>
              <p className="text-white/40 text-sm leading-relaxed">Precision cuts, beard sculpting, and executive grooming for the modern gentleman.</p>
            </button>
            <button 
              onClick={() => setCurrentView('ladies-booking')}
              className="glass p-12 rounded-[2rem] border border-white/10 hover:border-gold group transition-all duration-500 text-center"
            >
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gold transition-colors">
                <svg className="w-10 h-10 text-gold group-hover:text-dark-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Ladies Parlour</h3>
              <p className="text-white/40 text-sm leading-relaxed">Couture styling, revitalizing facials, and professional beauty treatments.</p>
            </button>
          </div>
          <button onClick={() => setCurrentView('home')} className="mt-12 text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-gold transition-all">Back to Home</button>
        </main>
      ) : currentView === 'gents-booking' ? (
        <BookingPage 
          type="gents" 
          barbers={barbers.filter(b => b.id === '1')} 
          services={services.filter(s => s.id === '1' || s.id === '3')} 
          onSubmit={handleBookingSubmit}
          onBack={() => setCurrentView('booking-selection')}
        />
      ) : currentView === 'ladies-booking' ? (
        <BookingPage 
          type="ladies" 
          barbers={barbers.filter(b => b.id === '2' || b.id === '3')} 
          services={services.filter(s => s.id === '2' || s.id === '4')} 
          onSubmit={handleBookingSubmit}
          onBack={() => setCurrentView('booking-selection')}
        />
      ) : (
        <main className="animate-fadeIn">
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              {HERO_IMAGES.map((img, idx) => (
                <img 
                  key={img}
                  src={img} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${heroImageIndex === idx ? 'opacity-40' : 'opacity-0'}`}
                  alt="Background"
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900" />
            </div>
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <span className="inline-block text-gold text-xs font-black tracking-[0.4em] uppercase mb-6 animate-fadeIn">
                Established 1994 &bull; Luxury Grooming & Beauty
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black mb-8 leading-tight animate-slideUp">
                Timeless.<br/>
                <span className="gold-gradient italic">Artistry.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed animate-fadeIn delay-300 font-medium">
                The ultimate unisex destination for elite grooming. From Gents Master Barbering to Ladies Premium Beauty Treatments, we define elegance for all.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fadeIn delay-500">
                <button 
                  onClick={() => setCurrentView('booking-selection')}
                  className="w-full sm:w-auto px-12 py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-full hover:bg-gold-light transform hover:scale-105 transition-all duration-300 shadow-xl shadow-gold/20 uppercase"
                >
                  RESERVE NOW
                </button>
                <a 
                  href="#services"
                  className="w-full sm:w-auto px-12 py-5 border border-white/20 hover:border-gold rounded-full text-xs font-black tracking-widest transition-all duration-300 hover:text-gold text-center uppercase"
                >
                  VIEW SERVICES
                </a>
              </div>
            </div>
          </section>

          <section id="services" className="py-32 bg-dark-800 scroll-mt-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-20">
                <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">Our Specialties</span>
                <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Gents & Ladies Collections</h2>
                <div className="h-1 w-20 bg-gold mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {services.map((service) => (
                  <div key={service.id} className="glass p-8 rounded-[2rem] border border-white/10 group hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-500 flex flex-col justify-between pointer-events-none relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[8px] font-black text-gold bg-gold/10 px-2 py-1 rounded-full uppercase tracking-tighter border border-gold/20">Signature Collection</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 uppercase tracking-tighter group-hover:text-gold transition-colors">{service.name}</h3>
                      <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-6">{service.duration_mins} MINS SESSION</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-3xl font-serif font-black gold-gradient relative z-10">₹{service.price}</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl opacity-20 group-hover:opacity-100 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="barbers" className="py-32 bg-dark-900">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                <div>
                  <span className="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4 block">The Artisans</span>
                  <h2 className="text-5xl font-serif font-bold mb-4 uppercase tracking-tight">Master Professionals</h2>
                  <p className="text-white/40 max-w-md leading-relaxed">Our team features elite male barbers and senior female stylists dedicated to perfect aesthetics and personalized care.</p>
                </div>
                <button className="hidden md:block text-white/20 text-xs font-black tracking-widest uppercase transition-all pointer-events-none border-b border-white/10 pb-1">GLOBAL TEAM ACCESS</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {barbers.map((barber) => (
                  <div key={barber.id} className="relative group pointer-events-none">
                    <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 transition-all duration-700 hover:shadow-2xl hover:shadow-gold/10">
                      <div className="absolute top-6 right-6 z-20">
                        <span className="bg-dark-900/80 backdrop-blur-md text-gold text-[9px] font-black px-4 py-2 rounded-full border border-gold/30 tracking-widest uppercase shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">Master Artist</span>
                      </div>
                      <img src={barber.image_url} alt={barber.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
                    </div>
                    <div className="absolute bottom-10 left-10 right-10">
                      <h3 className="text-3xl font-serif font-bold mb-2 uppercase tracking-tighter group-hover:text-gold transition-colors">{barber.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties.map(s => (
                          <span key={s} className="text-[9px] font-black tracking-widest uppercase text-gold bg-gold/5 px-3 py-1 rounded-full border border-gold/20 backdrop-blur-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsAuthModalOpen(false)} />
          <div className="relative glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md shadow-2xl">
            <h2 className="text-4xl font-serif font-black mb-2 text-center text-gold uppercase tracking-tighter">
              {isSignup ? 'Join The Studio' : 'Welcome Back'}
            </h2>
            <p className="text-white/40 text-center mb-10 text-[10px] font-black tracking-[0.3em] uppercase">The Fresh Cut & Beauty Experience</p>
            <form onSubmit={handleAuth} className="space-y-6">
              {isSignup && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-gold transition-colors text-sm text-white"
                    placeholder="Enter your name"
                    required={isSignup}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-gold transition-colors text-sm text-white"
                  placeholder="name@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/30 mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-gold transition-colors text-sm text-white"
                  placeholder="Your secret key"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gold text-dark-900 text-xs font-black tracking-widest rounded-2xl hover:bg-gold-light transition-all transform hover:scale-[1.02] shadow-xl shadow-gold/20"
              >
                {loading ? 'AUTHENTICATING...' : (isSignup ? 'CREATE ACCOUNT' : 'SIGN IN TO PROFILE')}
              </button>
            </form>
            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsSignup(!isSignup)}
                className="text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-gold transition-colors"
              >
                {isSignup ? 'Already a member? Sign In' : 'New to our Studio? Join Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-24 bg-dark-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-4xl font-serif font-black gold-gradient tracking-tighter mb-6 block">FRESH CUT & BEAUTY</span>
          <p className="text-white/40 max-w-lg mx-auto mb-12 text-sm leading-relaxed italic">
            A premium unisex destination for elite grooming. We blend timeless precision with modern aesthetics to craft the perfect look for every individual.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 max-w-4xl mx-auto text-left md:text-center border-y border-white/5 py-12">
            <div>
              <h4 className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-4">Visit Our Studio</h4>
              <p className="text-white/60 text-xs leading-loose">123 Artisan Avenue, Heritage District<br/>New Delhi, India 110001</p>
            </div>
            <div>
              <h4 className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-4">Contact Details</h4>
              <p className="text-white/60 text-xs leading-loose">P: +91 98765 43210<br/>E: studio@freshcut.in</p>
            </div>
            <div>
              <h4 className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-4">Connect With Us</h4>
              <div className="flex justify-start md:justify-center gap-6 mt-2">
                <span className="text-white/40 hover:text-gold transition-colors cursor-pointer text-xs uppercase font-black tracking-widest">Instagram</span>
                <span className="text-white/40 hover:text-gold transition-colors cursor-pointer text-xs uppercase font-black tracking-widest">Twitter</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-10 mb-12 text-[11px] font-black tracking-[0.25em] uppercase text-white/40">
            <button onClick={() => setCurrentView('home')} className="hover:text-gold transition-colors">Home</button>
            <a href="#services" className="hover:text-gold transition-colors">Services</a>
            <button onClick={() => handleDashboardLink()} className="hover:text-gold transition-colors">Dashboard</button>
            <button onClick={() => alert('Partner program details available on request.')} className="hover:text-gold transition-colors">Partner With Us</button>
          </div>
          
          <div className="h-px w-20 bg-gold/30 mx-auto mb-10" />
          <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-medium">&copy; 2024 Fresh Cut & Beauty Studio. Premium Unisex Experience. Crafted for Excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
