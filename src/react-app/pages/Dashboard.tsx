"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import { LogOut, UserCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; email?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('Sua sessão expirou ou você não está logado. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error('Erro ao buscar perfil:', profileError);
        toast.error('Erro ao carregar dados do perfil.');
      } else if (profile) {
        setUserProfile({ ...profile, email: user.email });
      } else {
        // If no profile found, use basic user info
        setUserProfile({ first_name: user.user_metadata.first_name || user.email?.split('@')[0], email: user.email });
      }
      setLoading(false);
    };

    fetchUserProfile();

    // Listen for auth state changes to update user info dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(); // Re-fetch if user session changes
      } else {
        setUserProfile(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    } else {
      localStorage.removeItem('userId'); // Clear local storage item
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Carregando dashboard...</p>
      </div>
    );
  }

  const displayName = userProfile?.first_name || userProfile?.email || 'Usuário';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-2xl w-full space-y-8 bg-gray-900 p-10 rounded-xl shadow-2xl border border-gray-700 text-center">
        <div className="flex justify-center mb-6">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover" />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-white" />
            </div>
          )}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Bem-vindo(a), {displayName}!
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Este é o seu painel de controle. Aqui você poderá gerenciar seus projetos, assinaturas e muito mais.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => toast.info('Funcionalidade em breve!')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Meus Projetos
          </button>
          <button
            onClick={() => toast.info('Funcionalidade em breve!')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            Minhas Assinaturas
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <LogOut className="w-5 h-5" />
            {loading ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </div>
    </div>
  );
}