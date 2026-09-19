import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DEMO_CREDENTIALS } from '../data/constants';
import { useStore } from '../store/useStore';

export function LoginPage() {
  const user = useStore((s) => s.user);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@h2secho.demo');
  const [password, setPassword] = useState('admin123');
  const [roleHint, setRoleHint] = useState<'Admin' | 'Safety Officer'>('Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const applyCreds = (role: 'Admin' | 'Safety Officer') => {
    setRoleHint(role);
    const c = DEMO_CREDENTIALS.find((d) => d.role === role)!;
    setEmail(c.email);
    setPassword(c.password);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 650));
    const ok = login(email.trim(), password);
    setLoading(false);
    if (!ok) {
      setError('Invalid credentials or disabled account');
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 20%, #abe0d4 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 80% 80%, #cbd5de 0%, transparent 45%), linear-gradient(160deg, #eef8f6 0%, #f4f6f8 40%, #e4e9ee 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%231b403a\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 flex w-full">
        <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-steel-900">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-display font-bold">
              H₂
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">H2S-ECHO</div>
              <div className="text-xs uppercase tracking-[0.2em] text-steel-500">Wearable Exposure Evidence</div>
            </div>
          </div>
          <div className="max-w-lg">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-semibold leading-tight mb-4"
            >
              The phone captures the chemical record.
              <span className="block text-brand-700 mt-2">The website preserves the evidence.</span>
            </motion.h1>
            <p className="text-steel-600 text-base leading-relaxed">
              Organize, analyse and monitor hydrogen sulfide exposure from reusable wristband cartridges —
              S1 FAST · S2 MEDIUM · S3 SLOW — across every shift and site.
            </p>
          </div>
          <p className="text-xs text-steel-500 font-mono">H2S-ECHO-WEB · Industrial Safety Platform</p>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel w-full max-w-md p-8"
          >
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-display font-bold text-sm">
                H₂
              </div>
              <span className="font-display font-semibold text-lg">H2S-ECHO</span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-brand-600" />
              <h2 className="font-display text-xl font-semibold">Sign in</h2>
            </div>
            <p className="text-sm text-steel-500 mb-6">Admin and Safety Officer access</p>

            <div className="flex gap-2 mb-5">
              {(['Admin', 'Safety Officer'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => applyCreds(role)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    roleHint === role
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                      : 'border-steel-200 dark:border-steel-700 text-steel-500 hover:bg-steel-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input font-mono" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full !py-2.5" disabled={loading}>
                {loading ? (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    Authenticating…
                  </motion.span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-steel-50 dark:bg-steel-950 border border-steel-200 dark:border-steel-800 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-steel-500 mb-2">Demo credentials</p>
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="w-full text-left text-xs font-mono py-1.5 hover:text-brand-700"
                  onClick={() => applyCreds(c.role)}
                >
                  <span className="text-steel-400">{c.role}:</span> {c.email} / {c.password}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
