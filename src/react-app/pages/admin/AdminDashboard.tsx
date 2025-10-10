"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import { LogOut, Users, Settings, BarChart2, FileText, ChevronLeft, FolderOpen } from 'lucide-react'; // Importando FolderOpen

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Administrador');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        toast.error('Erro ao carregar seu perfil.');
      } else {
        setUserName(profileData?.first_name || user.email?.split('@')[0] || 'Administrador');
      }
      setLoading(false);
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
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
      localStorage.removeItem('userId');
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Carregando painel de administrador...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Admin Header */}
      <header className="bg-gray-900 border-b border-purple-700/50 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            P4D Studio Admin
          </h1>
          <span className="text-gray-400 text-sm">Bem-vindo, {userName}!</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Painel de Administração
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card: Gerenciar Usuários */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25">
            <Users className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Gerenciar Usuários</h3>
            <p className="text-gray-300 mb-6">Visualize, edite e conecte perfis de clientes e administradores aos seus projetos.</p>
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
            >
              Acessar <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Card: Projetos e Assinaturas */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25">
            <FileText className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Projetos e Assinaturas</h3>
            <p className="text-gray-300 mb-6">Acompanhe o status dos projetos, assinaturas e pagamentos.</p>
            <button
              onClick={() => navigate('/admin/projetos')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200"
            >
              Acessar <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Card: Documentos do Projeto (PRD, Copy, IA Prompts) */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-orange-500/25">
            <FolderOpen className="w-12 h-12 text-orange-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Documentos do Projeto</h3>
            <p className="text-gray-300 mb-6">Gere PRDs, cópias e prompts com IA de forma automatizada.</p>
            <button
              onClick={() => navigate('/admin/documentos')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-200"
            >
              Acessar <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Card: Relatórios e Análises */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/25">
            <BarChart2 className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Relatórios e Análises</h3>
            <p className="text-gray-300 mb-6">Visualize métricas, relatórios de desempenho e evolução dos projetos.</p>
            <button
              onClick={() => navigate('/admin/relatorios')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200"
            >
              Acessar <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Card: Configurações do Sistema */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-yellow-500/25">
            <Settings className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Configurações do Sistema</h3>
            <p className="text-gray-300 mb-6">Gerencie integrações, papéis da equipe e automações.</p>
            <button
              onClick={() => navigate('/admin/configuracoes')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-all duration-200"
            >
              Acessar <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}