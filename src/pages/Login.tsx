import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl w-full border border-gray-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-2 items-center gap-0">

          {/* LEFT SIDE --- Form */}
          <div className="p-8 md:p-12 lg:p-16">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center mb-4">
                <ShieldAlert className="w-9 h-9 text-blue-700" />
              </div>
              <h1 className="text-3xl font-extrabold text-blue-800 tracking-wider">
                RESPONDE
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mt-1">
                Talisay MDRRMO Command Center
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Disaster Intake & Geospatial Analytics System
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Username / Operator ID
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mdrrmo_admin"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <span
                  onClick={() => alert('Please contact your System Administrator to reset your password.')}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-700/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all transform active:scale-[0.99] disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Authorized Personnel Only • Talisay, Batangas
              </p>
            </div>
          </div>

          {/* RIGHT SIDE --- Image Panel */}
          <div className="hidden md:block relative h-full min-h-[600px]">
            <img
              src="https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1000&auto=format&fit=crop"
              alt="Disaster Response"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-blue-900/70" />
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="max-w-sm">
                <h2 className="text-white text-3xl font-bold leading-tight">
                  Real-Time Disaster Intelligence
                </h2>
                <p className="text-blue-100 text-base font-medium mt-4 leading-relaxed">
                  Monitor incident reports, track geospatial data, and coordinate emergency response across Talisay, Batangas.
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="h-1 w-12 bg-white rounded-full" />
                  <span className="text-white text-sm font-semibold uppercase tracking-wider">
                    MDRRMO Operations
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}