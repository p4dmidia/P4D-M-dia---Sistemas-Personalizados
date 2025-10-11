"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import { LogOut, UserCircle, Check, X, Settings, MessageCircle, Calendar, FileText, Code, Search, DollarSign, CreditCard, TrendingUp, Sparkles, Hourglass, Info, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import Confetti from 'react-confetti';
import { Project, Subscription, FunnelResponse } from '@/shared/types'; // Import types
import { User } from '@supabase/supabase-js'; // Import Supabase User type

// Define project status mapping for progress and icons
const projectStatusMap = {
  briefing_received: { text: 'Briefing Recebido', progress: 25, icon: <FileText className="w-5 h-5" /> },
  development_started: { text: 'Desenvolvimento Iniciado', progress: 50, icon: <Code className="w-5 h-5" /> },
  internal_review: { text: 'Revisão Interna', progress: 75, icon: <Search className="w-5 h-5" /> },
  final_delivery: { text: 'Entrega Final', progress: 100, icon: <Check className="w-5 h-5" /> },
};

// Define timeline steps
const timelineSteps = [
  { id: 'briefing_received', label: 'Briefing recebido', icon: <FileText /> },
  { id: 'development_started', label: 'Desenvolvimento iniciado', icon: <Code /> },
  { id: 'internal_review', label: 'Revisão interna', icon: <Search /> },
  { id: 'final_delivery', label: 'Entrega final', icon: <Check /> },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; email?: string; avatar_url?: string; role?: string; stripe_customer_id?: string } | null>(null); // Adicionado stripe_customer_id
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [funnelResponse, setFunnelResponse] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'my-project' | 'updates-support' | 'settings'>('status');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedSubscriptionIdForCancellation, setSelectedSubscriptionIdForCancellation] = useState<string | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  const hasActivePlan = subscriptions.some(sub => sub.status === 'active');
  const currentProject = projects[0]; // Assuming the latest project is the current one
  const currentSubscription = subscriptions.find(sub => sub.status === 'active');

  const fetchDashboardData = useCallback(async (userFromAuth?: User) => {
    setLoading(true);
    try {
      let user = userFromAuth;
      if (!user) {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          // Este caso deve ser tratado pelo ProtectedRoute
          navigate('/login');
          return;
        }
        user = authUser;
      }

      // Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, stripe_customer_id, role') // Alterado para stripe_customer_id
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        toast.error('Erro ao carregar dados do perfil.');
      } else if (profile) {
        setUserProfile({ ...profile, email: user.email });
        // O redirecionamento de admin foi removido, o ProtectedRoute lida com isso
      } else {
        setUserProfile({ first_name: user.user_metadata.first_name || user.email?.split('@')[0], email: user.email, role: 'client' });
      }

      // Buscar projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Erro ao buscar projetos:', projectsError);
        toast.error('Erro ao carregar projetos.');
      } else {
        setProjects(projectsData || []);
        if (projectsData && projectsData.length > 0 && projectsData[0].funnel_response_id) {
          // Buscar resposta do funil para o projeto mais recente
          const { data: funnelData, error: funnelError } = await supabase
            .from('funnel_responses')
            .select('*')
            .eq('id', projectsData[0].funnel_response_id)
            .single();
          if (funnelError && funnelError.code !== 'PGRST116') {
            console.error('Erro ao buscar resumo do funil:', funnelError);
            toast.error('Erro ao carregar resumo do funil.');
          } else {
            setFunnelResponse(funnelData);
          }
        }
      }

      // Buscar assinaturas
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Erro ao buscar assinaturas:', subscriptionsError);
        toast.error('Erro ao carregar assinaturas.');
      } else {
        // Verificar se um novo plano ativo foi definido (ex: após um pagamento bem-sucedido)
        // 'subscriptions' aqui se refere ao estado *antes* desta atualização
        const previousHasActivePlan = subscriptions.some(sub => sub.status === 'active');
        const currentHasActivePlan = (subscriptionsData || []).some(sub => sub.status === 'active');
        
        setSubscriptions(subscriptionsData || []); // Atualizar o estado *após* a comparação

        if (!previousHasActivePlan && currentHasActivePlan) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000); // Esconder confetes após 5 segundos
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar dashboard:', error);
      toast.error('Ocorreu um erro inesperado ao carregar o painel.');
    } finally {
      setLoading(false); // Garantir que o loading seja sempre definido como false
    }
  }, [navigate]); // Removido 'subscriptions' das dependências

  useEffect(() => {
    fetchDashboardData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchDashboardData(session.user); // Passar o usuário diretamente
      } else {
        setUserProfile(null);
        setProjects([]);
        setSubscriptions([]);
        setFunnelResponse(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDashboardData, navigate]);

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

  const getProjectProgress = (status: string | undefined) => {
    if (!status) return 0;
    return projectStatusMap[status as keyof typeof projectStatusMap]?.progress || 0;
  };

  const getProjectStatusText = (status: string | undefined) => {
    if (!status) return 'Sem projeto ativo';
    return projectStatusMap[status as keyof typeof projectStatusMap]?.text || 'Status Desconhecido';
  };

  const handleActivatePlan = () => {
    // Isso idealmente navegaria para uma página de checkout ou diretamente para o Stripe
    // Por enquanto, vamos navegar para o resumo do funil onde os planos são listados.
    navigate('/funnel/summary');
    toast('Redirecionando para a seleção de planos...');
  };

  const handleManagePayment = async () => {
    if (!userProfile?.stripe_customer_id) {
      toast.error('ID de cliente Stripe não encontrado. Por favor, entre em contato com o suporte.');
      return;
    }

    toast.loading('Redirecionando para o portal do cliente Stripe...', { id: 'stripePortal' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'stripePortal' });
        navigate('/login');
        return;
      }

      // Chamar uma nova rota no worker para criar uma sessão do portal do cliente Stripe
      const response = await fetch('/api/stripe/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customer_id: userProfile.stripe_customer_id,
          return_url: window.location.href, // Retorna para o dashboard após gerenciar
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar sessão do portal do cliente Stripe.');
      }

      const { portalUrl } = await response.json();
      toast.success('Redirecionando...', { id: 'stripePortal' });
      window.location.href = portalUrl;

    } catch (error: any) {
      console.error('Erro ao gerenciar pagamento Stripe:', error);
      toast.error(error.message || 'Erro ao gerenciar pagamento. Tente novamente.', { id: 'stripePortal' });
    }
  };

  const handleChangePlan = () => {
    toast('Redirecionando para a página de troca de planos (funcionalidade em breve)!');
    // Redirecionar para uma página de seleção de planos
  };

  const confirmCancelSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionIdForCancellation(subscriptionId);
    setShowCancelConfirmation(true);
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscriptionIdForCancellation || !currentSubscription?.stripe_subscription_id) return;

    setLoading(true);
    setShowCancelConfirmation(false);
    toast.loading('Cancelando assinatura...', { id: 'cancelToast' });

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'cancelToast' });
        navigate('/login');
        return;
      }

      // Chamar uma nova rota no worker para cancelar a assinatura Stripe
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          stripe_subscription_id: currentSubscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao cancelar assinatura.');
      }

      toast.success('Assinatura cancelada com sucesso! O status será atualizado em breve.', { id: 'cancelToast' });
      // O webhook do Stripe irá atualizar o status no Supabase, então não precisamos chamar fetchDashboardData imediatamente.
      // Apenas atualizamos o estado local para refletir a intenção.
      setSubscriptions(prev => prev.map(sub => sub.id === selectedSubscriptionIdForCancellation ? { ...sub, status: 'canceled' } : sub));

    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error(error.message || 'Erro de conexão ao cancelar assinatura.', { id: 'cancelToast' });
    } finally {
      setLoading(false);
      setSelectedSubscriptionIdForCancellation(null);
    }
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent('Olá, preciso de suporte com meu projeto no P4D Studio!');
    const phoneNumber = '5511999999999'; // Substitua pelo número real do WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const displayName = userProfile?.first_name || userProfile?.email?.split('@')[0] || 'Usuário';
  const projectProgress = currentProject ? getProjectProgress(currentProject.status) : 0;
  const projectStatusText = currentProject ? getProjectStatusText(currentProject.status) : 'Nenhum projeto em andamento';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando seu painel P4D Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.1} />}

      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-lg border-b border-purple-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            P4D Studio
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-300 text-sm hidden md:block">
              Olá, <span className="font-semibold">{displayName}</span>! 👋
            </div>
            <div className="relative">
              <button
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-6 h-6" />
                )}
              </button>
              {isAvatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-10">
                  {userProfile?.role === 'admin' && (
                    <button onClick={() => { navigate('/admin/dashboard'); setIsAvatarMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left">
                      <LayoutDashboard className="inline-block w-4 h-4 mr-2" /> Painel Admin
                    </button>
                  )}
                  <button onClick={() => { setActiveTab('settings'); setIsAvatarMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left">
                    <Settings className="inline-block w-4 h-4 mr-2" /> Perfil & Configurações
                  </button>
                  <button onClick={handleLogout} className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full text-left">
                    <LogOut className="inline-block w-4 h-4 mr-2" /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Dynamic Subtext */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Olá, {displayName}! 👋
          </h1>
          <p className="text-lg text-gray-300">
            {hasActivePlan ? 'Tudo pronto! Seu projeto está em produção 🚀' : 'Seu projeto está quase saindo do papel!'}
          </p>
        </div>

        {/* No Active Plan Banner */}
        {!hasActivePlan && (
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 text-center mb-10 animate-pulse">
            <p className="text-xl text-blue-400 font-semibold mb-4">
              🚀 Seu projeto está quase saindo do papel!
            </p>
            <p className="text-lg text-gray-300 mb-6">
              Para iniciarmos o desenvolvimento e colocarmos sua ideia em prática, você precisa ativar um plano.
              Clique abaixo para escolher o melhor para você.
            </p>
            <button
              onClick={handleActivatePlan}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              Ativar meu plano agora
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-800/50 border border-gray-700 rounded-full p-1 flex space-x-2">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'status' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Status do Projeto
            </button>
            <button
              onClick={() => setActiveTab('my-project')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'my-project' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Meu Projeto
            </button>
            <button
              onClick={() => setActiveTab('updates-support')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'updates-support' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Atualizações & Suporte
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Configurações
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Project Status Tab */}
          {activeTab === 'status' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Status Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-400" /> Status do Projeto
                </h3>
                <div className="text-center mb-6">
                  <p className="text-xl text-gray-300 mb-2">Status Atual:</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {projectStatusText}
                  </p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${projectProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 text-right mb-6">{projectProgress}% Concluído</p>

                {hasActivePlan ? (
                  <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center">
                    <p className="text-lg text-gray-200">
                      🎉 Parabéns! Seu plano está ativo e seu projeto já está sendo preparado pela nossa equipe.
                      Você pode acompanhar o andamento na seção "Meu Projeto".
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center">
                    <p className="text-lg text-blue-400 font-semibold mb-4">
                      🚀 Seu projeto está quase saindo do papel.
                    </p>
                    <p className="text-md text-gray-300 mb-4">
                      Para iniciarmos o desenvolvimento, você precisa ativar seu plano.
                    </p>
                    <button
                      onClick={handleActivatePlan}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                    >
                      Ativar meu plano agora
                    </button>
                  </div>
                )}
              </div>

              {/* Active Plan Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-400" /> Plano Ativo
                </h3>
                {currentSubscription ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Nome do Plano:</span>
                      <span className="text-white font-semibold">{currentSubscription.plan_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Valor Mensal:</span>
                      <span className="text-green-400 font-semibold">R$ {currentSubscription.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Próxima Cobrança:</span>
                      <span className="text-white font-semibold">
                        {currentSubscription.next_due_date ? new Date(currentSubscription.next_due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status:</span>
                      <span className={`font-semibold ${currentSubscription.status === 'active' ? 'text-green-400' : 'text-orange-400'}`}>
                        {currentSubscription.status === 'active' ? 'Ativo ✅' : 'Inativo 🟠'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Método de Pagamento:</span>
                      <span className="text-white font-semibold">Cartão de Crédito (Stripe)</span> {/* Alterado para Stripe */}
                    </div>
                    <div className="flex flex-col gap-3 mt-6">
                      <button
                        onClick={handleManagePayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                      >
                        Gerenciar Pagamento
                      </button>
                      <button
                        onClick={handleChangePlan}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                      >
                        Trocar Plano
                      </button>
                      <button
                        onClick={() => confirmCancelSubscription(currentSubscription.id!)}
                        className="w-full bg-purple-800 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                      >
                        Cancelar Assinatura
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Info className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    <p>Você não possui um plano ativo no momento.</p>
                    <button
                      onClick={handleActivatePlan}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300"
                    >
                      Ativar Plano
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Project Tab */}
          {activeTab === 'my-project' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Summary Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-400" /> Resumo do seu Projeto
                </h3>
                {funnelResponse ? (
                  <div className="space-y-4 text-gray-300">
                    <p className="text-lg leading-relaxed">
                      Com base nas suas respostas, seu projeto inclui:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      {Object.entries(funnelResponse.step_data).map(([key, value]) => {
                        if (key === 'business_type' && value) return <li key={key}>Tipo de Negócio: <span className="font-semibold text-white">{value}</span></li>;
                        if (key === 'system_goal' && Array.isArray(value) && value.length > 0) return <li key={key}>Objetivos: <span className="font-semibold text-white">{value.join(', ')}</span></li>;
                        if (key === 'desired_features' && Array.isArray(value) && value.length > 0) return <li key={key}>Funcionalidades Desejadas: <span className="font-semibold text-white">{value.join(', ')}</span></li>;
                        if (key === 'visual_identity' && value) return <li key={key}>Identidade Visual: <span className="font-semibold text-white">{value}</span></li>;
                        if (key === 'additional_notes' && value) return <li key={key}>Observações: <span className="font-semibold text-white">{value}</span></li>;
                        return null;
                      })}
                    </ul>
                    {currentProject?.summary && (
                      <p className="text-lg leading-relaxed mt-4">
                        <span className="font-semibold text-blue-400">Sumário P4D:</span> {currentProject.summary}
                      </p>
                    )}
                    {currentProject?.estimated_delivery && (
                      <p className="text-lg leading-relaxed">
                        <span className="font-semibold text-green-400">Entrega Estimada:</span> {currentProject.estimated_delivery}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Info className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    <p>Nenhum resumo de projeto encontrado. Por favor, preencha o funil para criar um projeto.</p>
                    <button
                      onClick={() => navigate('/funnel')}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300"
                    >
                      Iniciar Funil
                    </button>
                  </div>
                )}
              </div>

              {/* Project Timeline Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Hourglass className="w-6 h-6 text-cyan-400" /> Linha do Tempo do Projeto
                </h3>
                <ol className="relative border-l border-gray-700 space-y-6 ml-4">
                  {timelineSteps.map((step, index) => {
                    const isActive = currentProject && projectStatusMap[currentProject.status as keyof typeof projectStatusMap]?.progress >= projectStatusMap[step.id as keyof typeof projectStatusMap]?.progress;
                    return (
                      <li key={step.id} className="mb-10 ml-6">
                        <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-gray-950 ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                          {step.icon}
                        </span>
                        <h4 className={`flex items-center mb-1 text-lg font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {step.label}
                          {isActive && <Check className="w-4 h-4 ml-2 text-green-400" />}
                        </h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                          {currentProject?.created_at && index === 0 ? `Iniciado em ${new Date(currentProject.created_at).toLocaleDateString('pt-BR')}` : ''}
                          {/* Adicionar datas dinâmicas para outras etapas se disponíveis nos dados do projeto */}
                        </time>
                        <p className="text-base font-normal text-gray-400">
                          {/* Descrição dinâmica baseada na etapa */}
                          {step.id === 'briefing_received' && 'Seu briefing foi recebido e está em análise inicial.'}
                          {step.id === 'development_started' && 'Nossa equipe iniciou o desenvolvimento do seu sistema.'}
                          {step.id === 'internal_review' && 'O sistema está em fase de testes e revisão interna.'}
                          {step.id === 'final_delivery' && 'Seu projeto foi concluído e entregue!'}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          {/* Updates & Support Tab */}
          {activeTab === 'updates-support' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Updates Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-orange-400" /> Atualizações do Projeto
                </h3>
                <div className="space-y-6">
                  {/* Dados Mock para Atualizações */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                      P4D
                    </div>
                    <div>
                      <p className="text-gray-300">
                        <span className="font-semibold">P4D Mídia:</span> Seu projeto entrou em fase de desenvolvimento.
                      </p>
                      <span className="text-sm text-gray-500">03/10/2024 10:30</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                      Você
                    </div>
                    <div>
                      <p className="text-gray-300">
                        <span className="font-semibold">Você:</span> Ótimo! Estou ansioso para ver o progresso.
                      </p>
                      <span className="text-sm text-gray-500">03/10/2024 11:00</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                      P4D
                    </div>
                    <div>
                      <p className="text-gray-300">
                        <span className="font-semibold">P4D Mídia:</span> Iniciamos a integração do gateway de pagamento.
                      </p>
                      <span className="text-sm text-gray-500">05/10/2024 14:15</span>
                    </div>
                  </div>
                  {/* Fim dos Dados Mock */}
                </div>
              </div>

              {/* Cartão de Suporte Rápido */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl text-center">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                  <MessageCircle className="w-6 h-6 text-green-400" /> Suporte Rápido
                </h3>
                <p className="text-lg text-gray-300 mb-6">
                  Precisa de ajuda? Fale com nossa equipe agora mesmo.
                </p>
                <button
                  onClick={handleWhatsAppSupport}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-6 h-6" />
                  Falar no WhatsApp
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  <a href="#" className="hover:text-blue-400 transition-colors">Acesse nossa Base de Conhecimento</a> (em breve)
                </p>
              </div>
            </div>
          )}

          {/* Aba de Configurações */}
          {activeTab === 'settings' && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-yellow-400" /> Configurações
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Dados Pessoais</h4>
                  <p className="text-gray-300">Nome: <span className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</span></p>
                  <p className="text-gray-300">Email: <span className="font-medium">{userProfile?.email}</span></p>
                  <p className="text-gray-300">Função: <span className="font-medium">{userProfile?.role === 'admin' ? 'Administrador' : 'Cliente'}</span></p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Editar Perfil</button>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Preferências de Notificação</h4>
                  <p className="text-gray-300">Receber notificações por email: <span className="font-medium">Sim</span></p>
                  <p className="text-gray-300">Receber notificações por WhatsApp: <span className="font-medium">Sim</span></p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Gerenciar Notificações</button>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-3">Tema do Projeto</h4>
                  <p className="text-gray-300">Opção de alterar logotipo, cores do sistema (funcionalidade em breve!)</p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Personalizar Tema</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full text-center">
            <X className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Confirmar Cancelamento</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all duration-200"
              >
                Não, Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}