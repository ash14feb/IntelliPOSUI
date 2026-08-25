import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Bluetooth, CheckCircle2, Cloud, CreditCard, LoaderCircle, Mail, MapPinned, MessageCircle, Phone, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { AuthSession } from '../types';
import { forgotPassword, login, registerTenant, resetPassword } from '../lib/api';

interface AuthViewProps {
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'careers' | 'pricing';

const quickHighlights = [
  'No App Installation Required',
  '100% Cloud-Based',
  'Works on Mobile, Tablet & Desktop',
  'Instant Setup - Start in Minutes',
  'Only Rs.99/month',
  'Free 7-Day Trial'
];

const features = [
  {
    title: 'Smart Billing',
    description: 'Fast, intuitive billing for retail, restaurants, and small businesses.',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Cloud Access',
    description: 'Login from anywhere. No dependency on a single machine.',
    icon: Cloud,
    color: 'bg-sky-50 text-sky-600'
  },
  {
    title: 'Live Reports',
    description: 'Track sales, profits, and performance in real time from any device.',
    icon: BarChart3,
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    title: 'Bluetooth Printing',
    description: 'Print receipts instantly via Bluetooth thermal printers.',
    icon: Bluetooth,
    color: 'bg-violet-50 text-violet-600'
  },
  {
    title: 'KOT Support',
    description: 'Send orders directly to kitchen printers for faster service.',
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    title: 'Unlimited Users',
    description: 'Add as many staff members as you need with no restrictions.',
    icon: Users,
    color: 'bg-rose-50 text-rose-600'
  },
  {
    title: 'GPS Attendance',
    description: 'Track staff attendance with GPS location accuracy.',
    icon: MapPinned,
    color: 'bg-teal-50 text-teal-600'
  },
  {
    title: 'Secure & Reliable',
    description: 'Your data stays safe in the cloud with strong protection.',
    icon: ShieldCheck,
    color: 'bg-indigo-50 text-indigo-600'
  }
];

const WHATSAPP_NUMBER = '919632621345';

const brandNames = [
  'Chai Point Cafe', 'Spice Route Kitchen', 'The Coffee Bean', 'Urban Tadka', 'Brew & Bites',
  'Green Leaf Dhaba', 'Sunset Bistro', 'Masala Street', 'Cafe Mocha', 'The Wok House',
  'Harbour Grill', 'Frost & Flavor', 'The Rolling Pin', 'Saffron Kitchen', 'Bean & Brew',
  'Coastal Curry', 'Pause Cafe', 'Spice Symphony', 'Nomad Pizza', 'The Lunch Box'
];

const jobListings = [
  {
    code: 'MKT-2026-01',
    title: 'Marketing Engineer',
    department: 'Marketing & Growth',
    experience: '2+ Years',
    type: 'Full-Time',
    location: 'Remote / Hybrid',
    description: 'Drive growth strategies, manage digital campaigns, and work closely with the engineering team to build data-driven marketing pipelines for our billing platform.'
  },
  {
    code: 'AIE-2026-01',
    title: 'AI Engineer',
    department: 'Engineering & AI',
    experience: '2+ Years',
    type: 'Full-Time',
    location: 'Remote / Hybrid',
    description: 'Design and deploy ML models for sales forecasting, receipt OCR, and intelligent business insights. Work with Python, TensorFlow, and cloud-based AI services.'
  }
];

export default function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') ? 'resetPassword' : 'register';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', businessName: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ctaLabel = useMemo(() => {
    if (mode === 'register') return 'Start Free Demo (7 Days)';
    if (mode === 'forgotPassword') return 'Reset Password';
    if (mode === 'resetPassword') return 'Set New Password';
    return 'Login';
  }, [mode]);

  useEffect(() => {
    // Clean the URL after reading the token
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const session = await login(loginForm);
      onAuthenticated(session);
    } catch (err: any) {
      setError(err?.message || 'Unable to login right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const message = await registerTenant(registerForm);
      setSuccessMessage(message);
      setMode('login');
      setLoginForm((current) => ({ ...current, username: '' }));
      setRegisterForm({ name: '', email: '', businessName: '' });
    } catch (err: any) {
      setError(err?.message || 'Unable to complete registration right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const message = await forgotPassword({ email: forgotEmail });
      setSuccessMessage(message);
      setForgotEmail('');
    } catch (err: any) {
      setError(err?.message || 'Unable to process request right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (resetForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = await resetPassword({ token: resetToken, newPassword: resetForm.newPassword });
      setSuccessMessage(message);
      setResetForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => switchMode('login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#eef6ff_42%,#fef3f2_100%)] text-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="smoke-cloud smoke-cloud-1" style={{ top: '-10%', left: '-5%' }} />
        <div className="smoke-cloud smoke-cloud-2" style={{ top: '20%', right: '-8%' }} />
        <div className="smoke-cloud smoke-cloud-3" style={{ top: '55%', left: '10%' }} />
        <div className="smoke-cloud smoke-cloud-4" style={{ top: '75%', right: '15%' }} />
        <div className="smoke-cloud smoke-cloud-5" style={{ top: '40%', left: '45%' }} />
      </div>
      <div className="relative">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 lg:px-8">
          <div>
            <p className="text-lg font-extrabold uppercase tracking-[0.2em] text-blue-600 sm:text-xl">Intelli Billing</p>
            <p className="mt-0.5 text-sm font-medium text-slate-500">Professional Cloud Billing Software</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Call Now</span>
            </a>
            <button
              type="button"
              onClick={() => switchMode('careers')}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Careers
            </button>
            <button
              type="button"
              onClick={() => switchMode('pricing')}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-600"
            >
              Start Free Demo
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Login
            </button>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-20 lg:pt-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Smart, Simple and Powerful Billing
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Intelli Billing Software Smart, Simple and Powerful Billing Solution
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Run your business from anywhere with a cloud-based POS. No installation. No hassle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:-translate-y-[1px] hover:bg-blue-600"
              >
                Start Free Demo (7 Days)
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Login
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickHighlights.map((highlight) => (
                <div key={highlight} className="rounded-3xl border border-white/70 bg-white/75 px-5 py-5 shadow-[0_18px_50px_rgba(148,163,184,0.16)] backdrop-blur">
                  <p className="text-sm font-semibold text-slate-800">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="relative">
            <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(148,163,184,0.22)] backdrop-blur lg:sticky lg:top-8 lg:p-8">
              {(mode === 'login' || mode === 'register') && (
                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'register' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-600'}`}
                  >
                    Start Free Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-600'}`}
                  >
                    Login
                  </button>
                </div>
              )}

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-600">{ctaLabel}</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  {mode === 'register' && 'Start your free 7-day trial'}
                  {mode === 'login' && 'Access your Intelli Billing workspace'}
                  {mode === 'forgotPassword' && 'Reset your password'}
                  {mode === 'resetPassword' && 'Set a new password'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {mode === 'register' && 'Create your business account now. Admin credentials will be sent to the registered email automatically.'}
                  {mode === 'login' && 'Login with the admin username and password sent to your email after registration.'}
                  {mode === 'forgotPassword' && 'Enter your registered email address and we will send you a link to reset your password.'}
                  {mode === 'resetPassword' && 'Enter your new password below. Make sure it is at least 6 characters long.'}
                </p>
              </div>

              {successMessage && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              {mode === 'login' && (
                <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Admin Username</label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter admin username"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgotPassword')}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Signing In...</> : 'Login'}
                  </button>
                </form>
              )}

              {mode === 'forgotPassword' && (
                <form className="mt-6 space-y-5" onSubmit={handleForgotSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
                  >
                    Back to Login
                  </button>
                </form>
              )}

              {mode === 'resetPassword' && (
                <form className="mt-6 space-y-5" onSubmit={handleResetSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                    <input
                      type="password"
                      value={resetForm.newPassword}
                      onChange={(event) => setResetForm((current) => ({ ...current, newPassword: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
                    <input
                      type="password"
                      value={resetForm.confirmPassword}
                      onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset Password'}
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <form className="mt-6 space-y-5" onSubmit={handleRegisterSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Business owner name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Business email"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Business Name</label>
                    <input
                      type="text"
                      value={registerForm.businessName}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, businessName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Registered business name"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Register Now'}
                  </button>
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Admin username and password will be delivered to the registered email once registration is complete.
                  </p>
                </form>
              )}

              {mode === 'careers' && (
                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-600">Careers</p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">Join Our Team</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      We are building the future of cloud billing. If you are passionate about technology, we would love to hear from you.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {jobListings.map((job) => (
                      <div key={job.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                            <p className="text-sm font-medium text-blue-600">{job.department}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">{job.code}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{job.experience}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{job.type}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{job.location}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">{job.description}</p>
                        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0" />
                          To apply, send your CV with the job code <span className="font-black">{job.code}</span> in the subject to <span className="font-black">careers@itsreviver.com</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'pricing' && (
                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-600">Pricing</p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">Simple, transparent pricing</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">Choose the plan that fits your business. Billed annually. Printers sold separately.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Intelli Lite */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Intelli Lite</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">Rs.69</span>
                        <span className="text-sm font-semibold text-slate-500">/month</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Billed annually</p>
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="mt-4 w-full rounded-xl border-2 border-blue-600 bg-white py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                      >
                        Start Free Trial
                      </button>
                      <div className="mt-4 space-y-2.5">
                        {[
                          'Smart Billing',
                          'Cloud Access',
                          'Live Reports & Analytics',
                          'Bluetooth Printing',
                          'KOT Printing',
                          'Unlimited Users',
                          'GPS Attendance',
                          'Receipt Customization',
                          'Multi-Category Menu',
                          'Discount & Tax Config',
                          'Email Support'
                        ].map(m => (
                          <div key={m} className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Intelli Pro */}
                    <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-5 shadow-lg shadow-blue-100">
                      <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Most Popular</span>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Intelli Pro</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">Rs.99</span>
                        <span className="text-sm font-semibold text-slate-500">/month</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Billed annually</p>
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Start Free Trial
                      </button>
                      <div className="mt-4 space-y-2.5">
                        {[
                          'Everything in Lite, plus:',
                          'Staff Attendance Module',
                          'QR Menu Module',
                          'Table Ordering by Customers',
                          'Positive Review QR',
                          'Advanced Sales Analytics',
                          'Customer Insights Dashboard',
                          'Priority Support'
                        ].map(m => (
                          <div key={m} className={`flex items-center gap-2 text-sm ${m.startsWith('Everything') ? 'font-bold text-blue-700' : 'text-slate-700'}`}>
                            <CheckCircle2 className={`h-4 w-4 shrink-0 ${m.startsWith('Everything') ? 'text-blue-600' : 'text-emerald-500'}`} />
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-center text-slate-400">* Printers are sold separately and are not included in any plan.</p>
                </div>
              )}
            </div>
          </section>
        </section>

        {/* Banner */}
        <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(148,163,184,0.18)]">
            <img
              src="https://i.ibb.co/k2bPy5Vx/81e0b00d-d27c-4586-a80b-8fe6c4f524a3.png"
              alt="Intelli Billing Banner"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        {/* Trusted by Brands */}
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Trusted by Leading Brands</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900 lg:text-3xl">Powering businesses across India</h2>
          </div>
          <div className="overflow-hidden relative">
            <div className="brand-scroll flex gap-12 whitespace-nowrap items-center">
              {[...brandNames, ...brandNames].map((brand, i) => (
                <span key={i} className="text-2xl font-extrabold text-slate-300 tracking-tight sm:text-3xl lg:text-4xl select-none">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Features</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 lg:text-4xl">Everything you need in one cloud POS</h2>
            <p className="mt-4 text-base text-slate-500 max-w-2xl mx-auto">Powerful tools designed to simplify your daily business operations</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md hover:shadow-blue-50">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-16">
          <div className="rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_35%,#fdf2f8_100%)] px-6 py-10 text-center shadow-[0_28px_90px_rgba(148,163,184,0.18)] lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Ready To Simplify Your Business?</p>
            <h2 className="mt-4 text-3xl font-black text-slate-900 lg:text-5xl">Start your journey with Intelli Billing today</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Cloud billing, reports, attendance, printer support, and staff access in one streamlined platform.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="rounded-2xl bg-blue-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-600"
              >
                Register Now
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/80 px-4 py-8 text-center text-sm text-slate-500 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex gap-5">
              <span>About Us</span>
              <button onClick={() => switchMode('pricing')} className="hover:text-slate-700 transition">Pricing</button>
              <button onClick={() => switchMode('careers')} className="hover:text-slate-700 transition">Careers</button>
              <span>Contact</span>
              <span>Privacy Policy</span>
              <span>Terms & Conditions</span>
            </div>
            <p>Intelli Billing Software</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
