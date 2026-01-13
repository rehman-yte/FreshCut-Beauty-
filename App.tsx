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

type AppView = 'home' | 'dashboard' | 'booking-flow' | 'partner' | 'login' | 'signup' | 'admin-panel' | 'payment-mockup' | 'admin-login';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedPartners, setApprovedPartners] = useState<Professional[]>([]);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('customer');

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

  const logActivity = async (type: string, message: string, refId: string = '', actorRole?: UserRole) => {
    try {
      await supabase.from('notifications').insert([{
        type,
        actor_role: actorRole || (profile?.role || 'customer'),
        message,
        reference_id: refId,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn('Logging failure:', e);
    }
  };

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("VERIFICATION ERROR: A valid email address is required to receive your security code.");
      return;
    }
    
    setIsSendingOtp(true);
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        setOtpSent(true);
        alert(`SECURITY TRANSMISSION: A verification code has been dispatched to ${email}.\n\nSubject: Your Fresh Cut OTP Verification\n\nPlease check your inbox. Code expires in 5 minutes.`);
        await logActivity('system_action', `Identity OTP dispatched to ${email}`, 'email-auth', 'customer');
      } else {
        alert(`Verification Gateway Error: ${result.error || 'Server responded with an error.'}`);
      }
    } catch (error) {
      alert("Connectivity Error: Unable to reach the verification server. This can happen if the Vercel API deployment is still in progress or if there's a routing conflict.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      alert("Please enter the 6-digit verification code.");
      return;
    }

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();

      if (response.ok && result.verified) {
        setIsOtpVerified(true);
        alert("IDENTITY CONFIRMED: Email ownership verified. Registry unlocked.");
        logActivity('system_action', `Identity Verified: ${email}`, 'auth-success', 'customer');
      } else {
        alert(`INVALID OTP: ${result.error || 'Verification protocol rejected the code.'}`);
      }
    } catch (error) {
      alert("Identity Verification Timeout: Could not reach authorization service. Please retry.");
    }
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'signup' | 'admin') => {
    e.preventDefault();
    
    if (type === 'admin') {
      if (email === 'rhfarooqui16@gmail.com' && password === 'TheKing1278@') {
        const adminProfile: Profile = {
          id: 'admin-oracle-001',
          full_name: 'Marketplace Supervisor',
          email: email,
          role: 'admin',
          status: 'active',
          otp_verified: true,
          email_verified: true,
          pan_verified: true
        };
        setProfile(adminProfile);
        await logActivity('user_login', `Admin Identity Authenticated: Supervisor Session Started`, adminProfile.id, 'admin');
        setCurrentView('admin-panel');
        return;
      } else {
        alert("ACCESS DENIED: Invalid administrative credentials.");
        return;
      }
    }

    if (type === 'signup' && authRole === 'customer') {
      if (!isOtpVerified) {
        alert("REGISTRY ERROR: Email identity verification is mandatory for Customer registry entries.");
        return;
      }
    }

    const newProfile: Profile = {
      id: 'usr-' + Date.now(),
      full_name: fullName || 'Verified Artisan Member',
      email: email,
      mobile: mobile,
      role: authRole,
      status: authRole === 'professional' ? 'pending' : 'active',
      otp_verified: isOtpVerified,
      email_verified: authRole === 'customer',
      pan_verified: false
    };

    setProfile(newProfile);
    
    if (type === 'signup') {
      await logActivity('user_signup', `New ${authRole} entry in registry: ${newProfile.full_name}`, newProfile.id, authRole);
      if (authRole === 'professional') {
        alert("ONBOARDING: Profile established as 'Pending'. Log in to complete document verification for marketplace activation.");
      }
    } else {
      await logActivity('user_login', `Member Identity Authorized: ${newProfile.full_name}`, newProfile.id, authRole);
    }
    
    setCurrentView('dashboard');
  };

  const handleBookingComplete = async (bookingData: any) => {
    if (!profile) {
      setCurrentView('login');
      return;
    }

    try {
      const appointmentTime = `${bookingData.date}T${bookingData.time}:00Z`;
      const bookingId = 'bk-' + Date.now();
      
      const { error } = await supabase.from('bookings').insert([{
        id: bookingId,
        customer_id: profile.id,
        professional_id: bookingData.professionalId || null,
        service_id: bookingData.serviceId,
        appointment_time: appointmentTime,
        status: 'searching',
        created_at: new Date().toISOString()
      }]);

      if (!error) {
        await logActivity('booking_created', `Marketplace Demand Signal emitted by ${profile.full_name}`, bookingId);
        setCurrentView('payment-mockup');
      }
    } catch (err) {
      console.error('Flow broken:', err);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem('freshcut_session');
    localStorage.removeItem('freshcut_view_state');
    setCurrentView('home');
    fetchApprovedPartners();
    // Security cleanup
    setOtpSent(false);
    setIsOtpVerified(false);
    setOtp('');
    setMobile('');
    setEmail('');
    setPassword('');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <h1 className="text-gold text-[10px] font-black tracking-[0.5em] uppercase animate-pulse mb-6">Securing Architecture...</h1>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gold animate-[progress_2s_infinite_linear]" style={{width: '30%'}} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-gold selection:text-dark-900">
      <Navbar 
        userRole={profile?.role} 
        onLogout={handleLogout} 
        onAuthOpen={() => setCurrentView('login')}
        currentView={currentView === 'dashboard' || currentView === 'admin-panel' ? 'dashboard' : 'home'}
        onViewChange={handleViewChange}
      />

      {currentView === 'login' && (
        <div className="min-h-screen pt-32 flex items-center justify-center p-4">
          <div className="glass p-12 rounded-[2rem] border border-white/10 w-full max-w-md animate-fadeIn">
            <h2 className="text-4xl font-serif font-black mb-10 text-center text-gold uppercase tracking-tighter">Member Login</h2>
            <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-6">
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4">
                <button type="button" onClick={() => setAuthRole('customer')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'customer' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Customer</button>
                <button type="button" onClick={() => setAuthRole('professional')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${authRole === 'professional' ? 'bg-gold text-dark-900' : 'text-white/40 hover:text-white'}`}>Professional</button>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Identity (Email)" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-gold" placeholder="Clearance Key (Password)" required />
              <button type="submit" className="w-full py-5 bg-gold text-dark-900 font-black tracking-widest rounded-2xl uppercase shadow-lg shadow-gold/20 hover:bg-gold-light transition-all">Authorize Access</button>
            </form>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button onClick={() => setCurrentView('signup')} className="text-[10px] text-white/40 uppercase tracking-widest hover:text-gold transition-colors">Apply for Registry</button>
              <div className="h-px w-12 bg-white/10" />
              <button onClick={() => setCurrentView('admin-login')} className="px-6 py-2 border border-white