import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Bluetooth, CheckCircle2, Cloud, CreditCard, LoaderCircle, MapPinned, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { AuthSession } from '../types';
import { forgotPassword, login, registerTenant, resetPassword } from '../lib/api';

interface AuthViewProps {
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

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

const reasons = [
  'Designed for businesses of every size',
  'Easy to use with no technical knowledge needed',
  'Works even on low-end devices',
  'Affordable for growing businesses',
  'Fast and reliable performance'
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
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-600">Intelli Billing Software</p>
            <p className="mt-1 text-sm text-slate-600">Cloud billing made simple for businesses everywhere</p>
          </div>
          <div className="flex items-center gap-3">
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
            </div>
          </section>
        </section>

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

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,#ecfeff_0%,#f0fdf4_100%)] p-8 shadow-[0_22px_70px_rgba(167,243,208,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Pricing</p>
              <h2 className="mt-4 text-4xl font-black text-slate-900">Just Rs.99/month</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">No hidden charges. No complicated plans.</p>
              <div className="mt-6 space-y-3">
                {['All Features Included', 'Unlimited Users', 'Cloud Access', 'Support Included'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Start Free 7-Day Trial Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_18px_60px_rgba(148,163,184,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Why Choose Intelli Billing?</p>
              <h2 className="mt-4 text-3xl font-black text-slate-900">Built to simplify daily business operations without adding complexity</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {reasons.map((reason) => (
                  <div key={reason} className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
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
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Try Free for 7 Days
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/80 px-4 py-8 text-center text-sm text-slate-500 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex gap-5">
              <span>About Us</span>
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
