'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios, { AxiosError } from 'axios';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await axios.post('/api/auth/login', { email, password });
                router.push('/');
            } else {
                await axios.post('/api/auth/register', { name, email, password });
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err: unknown) {
            const axiosError = err as AxiosError<{ error: string }>;
            const errorMessage = axiosError.response?.data?.error || 'An error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background image - Same as Home */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
            </div>

            <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-8 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="text-2xl font-bold tracking-tighter">V2V</div>
                </div>
            </nav>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-8 md:p-12">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
                        </h1>
                        <p className="text-gray-400 text-sm uppercase tracking-widest">
                            {isLogin ? 'Enter your credentials to continue' : 'Start your translation journey today'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-700"
                                        placeholder="YOUR NAME"
                                        required={!isLogin}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-700"
                                placeholder="EMAIL@EXAMPLE.COM"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <p className={`text-xs uppercase tracking-widest ${error.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
                                {error}
                            </p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-4 text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-gray-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
