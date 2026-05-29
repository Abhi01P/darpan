import { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Auth({ onLogin: _onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary'>('male');
  
  const { login, register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password, gender);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-secondary-container/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary-container/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-low/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">
              DrapeNet
            </h1>
          </div>
          <p className="text-on-surface-variant">Enter the virtual fitting room.</p>
        </div>

        <div className="flex w-full mb-6 border-b border-white/10">
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              isLogin ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              !isLogin ? 'text-on-surface border-b-2 border-primary' : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Gender</label>
                <div className="flex bg-surface-container-high/50 border border-white/10 rounded-lg p-1">
                  {(['male', 'female', 'non-binary'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors capitalize ${
                        gender === g
                          ? 'bg-primary text-on-primary'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {g === 'non-binary' ? 'Non-Binary' : g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stylist@drapenet.com"
                required
                className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Password</label>
              {isLogin && <a href="#" className="text-xs text-primary hover:text-primary-container transition-colors">Forgot?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface-container-high/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-error text-center py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-container font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all mt-2 shadow-[0_0_15px_rgba(192,193,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.3)] disabled:opacity-50"
            style={{ color: 'var(--color-on-primary)' }}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Enter Try-On Lens' : 'Create Wardrobe'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-on-surface-variant mt-4">
            By continuing, you agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
