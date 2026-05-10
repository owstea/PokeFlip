'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Home, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
        }
      } catch (error) {
        console.error('Erreur auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsLoggingOut(false);
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-600/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
                🔄 Flip Tracker
              </Link>
            </div>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                  href="/"
                  className="text-white hover:text-blue-200 transition text-sm lg:text-base flex items-center gap-2"
              >
                <Home size={18} />
                Accueil
              </Link>

              {isAuthenticated && (
                  <>
                    <Link
                        href="/items"
                        className="text-white hover:text-blue-200 transition text-sm lg:text-base flex items-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Items
                    </Link>
                    <Link
                        href="/ventes"
                        className="text-white hover:text-blue-200 transition text-sm lg:text-base flex items-center gap-2"
                    >
                      <TrendingUp size={18} />
                      Ventes
                    </Link>
                  </>
              )}

              {isAuthenticated && userEmail && (
                  <div className="flex items-center gap-4 pl-4 lg:pl-6 border-l border-white/30">
                <span className="text-white text-xs lg:text-sm truncate max-w-[150px]">
                  👤 {userEmail}
                </span>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed px-3 lg:px-4 py-2 rounded-lg font-bold transition text-white text-sm whitespace-nowrap flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      {isLoggingOut ? '⏳...' : 'Déconnexion'}
                    </button>
                  </div>
              )}

              {!isAuthenticated && !loading && (
                  <Link
                      href="/auth/login"
                      className="bg-green-500 hover:bg-green-600 px-3 lg:px-4 py-2 rounded-lg font-bold transition text-white text-sm whitespace-nowrap flex items-center gap-2"
                  >
                    <LogIn size={16} />
                    Connexion
                  </Link>
              )}
            </div>

            {/* Burger Menu Button (Mobile) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden flex flex-col gap-1.5 p-2"
                disabled={isLoggingOut}
            >
            <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                    isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
            ></span>
              <span
                  className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                      isOpen ? 'opacity-0' : ''
                  }`}
              ></span>
              <span
                  className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                      isOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
              ></span>
            </button>
          </div>

          {/* Menu Mobile */}
          {isOpen && (
              <div className="md:hidden bg-purple-700 pb-4 space-y-2 animate-in fade-in slide-in-from-top">
                <Link
                    href="/"
                    className="block px-4 py-2 text-white hover:bg-purple-600 rounded-lg transition text-sm flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                >
                  <Home size={18} />
                  Accueil
                </Link>

                {isAuthenticated && (
                    <>
                      <Link
                          href="/items"
                          className="block px-4 py-2 text-white hover:bg-purple-600 rounded-lg transition text-sm flex items-center gap-2"
                          onClick={() => setIsOpen(false)}
                      >
                        <ShoppingBag size={18} />
                        Items
                      </Link>
                      <Link
                          href="/ventes"
                          className="block px-4 py-2 text-white hover:bg-purple-600 rounded-lg transition text-sm flex items-center gap-2"
                          onClick={() => setIsOpen(false)}
                      >
                        <TrendingUp size={18} />
                        Ventes
                      </Link>
                    </>
                )}

                {isAuthenticated && userEmail && (
                    <>
                      <div className="px-4 py-2 border-t border-purple-500 mt-2">
                        <p className="text-white text-xs font-semibold text-purple-200">Connecté en tant que:</p>
                        <p className="text-white text-sm truncate mt-1">👤 {userEmail}</p>
                      </div>

                      <button
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                          disabled={isLoggingOut}
                          className="w-full text-left px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg font-bold transition text-white text-sm flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        {isLoggingOut ? '⏳ Déconnexion...' : 'Déconnexion'}
                      </button>
                    </>
                )}

                {!isAuthenticated && !loading && (
                    <Link
                        href="/auth/login"
                        className="block px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition text-white text-center text-sm flex items-center justify-center gap-2"
                        onClick={() => setIsOpen(false)}
                    >
                      <LogIn size={16} />
                      Connexion
                    </Link>
                )}
              </div>
          )}
        </div>
      </nav>
  );
}
