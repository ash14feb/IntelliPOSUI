import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Bluetooth, CheckCircle2, Cloud, CreditCard, MapPinned, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { AuthSession } from '../types';
import { login, registerTenant } from '../lib/api';

interface AuthViewProps {
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = 'login' | 'register';

const quickHighlights = [
  'No App Installation Required',
  '100% Cloud-Based',
  'Works on Mobile, Tablet & Desktop',
  'Instant Setup - Start in Minutes',
  'Only Rs.99/month',
  'Free 7-Day Trial'
];

const sliderCards = [
  {
    title: 'Smart Billing For Fast Counters',
    text: 'Create bills in seconds with clean item selection, payment modes, receipt printing, and customer capture.',
    accent: 'from-sky-400 to-cyan-300'
  },
  {
    title: 'Business Reports From Anywhere',
    text: 'Track sales, customers, and performance in real time from desktop, tablet, or mobile.',
    accent: 'from-fuchsia-400 to-rose-300'
  },
  {
    title: 'Cloud Access With Zero Hassle',
    text: 'Login from anywhere and keep your business running without installing software on every machine.',
    accent: 'from-emerald-400 to-lime-300'
  }
];

const features = [
  {
    title: 'Smart Billing System',
    description: 'Fast and intuitive billing designed for speed and accuracy. Perfect for retail, restaurants, and small businesses.',
    icon: CreditCard
  },
  {
    title: 'Cloud-Based Access',
    description: 'Access your business anytime, anywhere. Just login and start working with no dependency on a single system.',
    icon: Cloud
  },
  {
    title: 'Reports On The Go',
    description: 'Track sales, profits, and performance in real time with powerful reports accessible from any device.',
    icon: BarChart3
  },
  {
    title: 'Bluetooth Printer Support',
    description: 'Print bills instantly using supported Bluetooth thermal printers with simple setup.',
    icon: Bluetooth
  },
  {
    title: 'KOT Support',
    description: 'Ideal for restaurants. Send orders directly to kitchen printers for faster service.',
    icon: Sparkles
  },
  {
    title: 'Unlimited Users',
    description: 'Add as many staff members as you want with no extra restrictions.',
    icon: Users
  },
  {
    title: 'GPS-Based Staff Attendance',
    description: 'Track staff attendance with GPS location accuracy for better workforce management.',
    icon: MapPinned
  },
  {
    title: 'Secure & Reliable',
    description: 'Your data stays securely stored in the cloud with strong protection and dependable backups.',
    icon: ShieldCheck
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
  const [mode, setMode] = useState<AuthMode>('register');
  const [sliderIndex, setSliderIndex] = useState(0);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', businessName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ctaLabel = useMemo(() => (mode === 'register' ? 'Start Free Demo (7 Days)' : 'Login'), [mode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSliderIndex((current) => (current + 1) % sliderCards.length);
    }, 3500);

    return () => window.clearInterval(timer);
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#eef6ff_42%,#fef3f2_100%)] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_25%),radial-gradient(circle_at_80%_10%,_rgba(244,114,182,0.18),_transparent_22%),radial-gradient(circle_at_50%_60%,_rgba(250,204,21,0.12),_transparent_28%)]" />
      <div className="relative">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Scanex POS</p>
            <p className="mt-1 text-sm text-slate-600">Cloud billing made simple for businesses everywhere</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600"
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
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Smart, Simple and Powerful Billing
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Scanex POS Smart, Simple and Powerful Billing Solution
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Run your business from anywhere with a cloud-based POS. No installation. No hassle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(56,189,248,0.28)] transition hover:-translate-y-[1px] hover:bg-sky-600"
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

            <div className="mt-10 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_24px_80px_rgba(148,163,184,0.18)] backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Product Slider</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{sliderCards[sliderIndex].title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{sliderCards[sliderIndex].text}</p>
                </div>
                <div className={`hidden h-20 w-20 rounded-3xl bg-gradient-to-br ${sliderCards[sliderIndex].accent} shadow-lg sm:block`} />
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_35%,#fdf2f8_100%)] p-5">
                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Sales', value: 'Rs.12,480', tone: 'bg-sky-50 text-sky-700' },
                        { label: 'Bills', value: '146', tone: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Customers', value: '89', tone: 'bg-rose-50 text-rose-700' }
                      ].map((card) => (
                        <div key={card.label} className={`rounded-2xl ${card.tone} p-4`}>
                          <p className="text-sm font-medium">{card.label}</p>
                          <p className="mt-2 text-2xl font-black">{card.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 h-40 rounded-3xl bg-[linear-gradient(180deg,#ffffff_0%,#e0f2fe_100%)] p-5">
                      <div className="flex h-full items-end gap-3">
                        {[52, 68, 64, 90, 76, 104, 92, 118, 108, 126].map((height, index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-t-2xl bg-gradient-to-t ${sliderCards[sliderIndex].accent} opacity-90 transition-all duration-500`}
                            style={{ height: `${height}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-100 bg-amber-50 p-5">
                      <p className="text-sm text-amber-700">Simple onboarding</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">Register and get started fast</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-fuchsia-50 p-5">
                      <p className="text-sm text-fuchsia-700">Flexible access</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">Use it on desktop, tablet, or mobile</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {sliderCards.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSliderIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${sliderIndex === index ? 'w-10 bg-sky-500' : 'w-2.5 bg-slate-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <section className="relative">
            <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(148,163,184,0.22)] backdrop-blur lg:sticky lg:top-8 lg:p-8">
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'register' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-600'}`}
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

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">{ctaLabel}</p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  {mode === 'register' ? 'Start your free 7-day trial' : 'Access your Scanex POS workspace'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {mode === 'register'
                    ? 'Create your business account now. Admin credentials will be sent to the registered email automatically.'
                    : 'Login with the admin username and password sent to your email after registration.'}
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

              {mode === 'login' ? (
                <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Admin Username</label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Signing In...' : 'Login'}
                  </button>
                </form>
              ) : (
                <form className="mt-6 space-y-5" onSubmit={handleRegisterSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Registered business name"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Register Now'}
                  </button>
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Admin username and password will be delivered to the registered email once registration is complete.
                  </p>
                </form>
              )}
            </div>
          </section>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Features</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 lg:text-4xl">Everything needed to run billing, reporting, and operations in one cloud POS</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-[0_18px_60px_rgba(148,163,184,0.16)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(96,165,250,0.18)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </article>
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
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Why Choose Scanex POS?</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Ready To Simplify Your Business?</p>
            <h2 className="mt-4 text-3xl font-black text-slate-900 lg:text-5xl">Start your journey with Scanex POS today</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Cloud billing, reports, attendance, printer support, and staff access in one streamlined platform.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="rounded-2xl bg-sky-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-sky-600"
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
            <p>Scanex POS cloud platform</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
