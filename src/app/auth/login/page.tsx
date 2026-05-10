'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Valide les champs
            if (!email || !password) {
                setError('Veuillez remplir tous les champs');
                setLoading(false);
                return;
            }

            // Connexion
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message || 'Erreur de connexion');
                setLoading(false);
                return;
            }

            // ✅ ÉCOUTE LE CHANGEMENT D'AUTH ET REDIRIGE
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                if (session?.user) {
                    setLoading(false);
                    subscription?.unsubscribe();
                    router.push('/');
                }
            });
        } catch (err) {
            console.error('Erreur:', err);
            setError('Une erreur est survenue');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 pt-20">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-purple-500/20">
                {/* Titre */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                        Connexion
                    </h1>
                    <p className="text-gray-400 text-sm">Accédez à votre compte Flip Tracker</p>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                        <p className="text-red-300 text-sm font-semibold">❌ {error}</p>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
                            📧 Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Mot de passe */}
                    <div>
                        <label htmlFor="password" className="block text-white text-sm font-semibold mb-2">
                            🔐 Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Bouton Connexion */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-purple-400 disabled:to-purple-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition transform hover:scale-105 active:scale-95 mb-4"
                    >
                        {loading ? '⏳ Connexion en cours...' : '🚀 Se connecter'}
                    </button>

                    {/* Lien Inscription */}
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            Pas encore de compte ?{' '}
                            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                                S'inscrire
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="text-center mt-8">
                    <Link href="/" className="text-gray-400 hover:text-gray-300 transition text-sm">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
