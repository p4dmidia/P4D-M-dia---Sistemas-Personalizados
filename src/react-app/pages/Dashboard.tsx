"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import { LogOut, UserCircle, Check, X, Settings, MessageCircle, Calendar, FileText, Code, Search, DollarSign, CreditCard, TrendingUp, Sparkles, Hourglass, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; email?: string; avatar_url?: string } | null>(null);
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
          toast.error('Sua sessão expirou ou você não está logado. Por favor, faça login novamente.');
          navigate('/login');
          return;
        }
        user = authUser;
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, asaas_customer_id') // Fetch asaas_customer_id
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        toast.error('Erro ao carregar dados do perfil.');
      } else if (profile) {
        setUserProfile({ ...profile, email: user.email });
      } else {
        setUserProfile({ first_name: user.user_metadata.first_name || user.email?.split('@')[0], email: user.email });
      }

      // Fetch projects
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
          // Fetch funnel response for the latest project
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

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Erro ao buscar assinaturas:', subscriptionsError);
        toast.error('Erro ao carregar assinaturas.');
      } else {
        // Check if a new active plan was just set (e.g., after a successful payment)
        // 'subscriptions' here refers to the state *before* this update
        const previousHasActivePlan = subscriptions.some(sub => sub.status === 'active');
        const currentHasActivePlan = (subscriptionsData || []).some(sub => sub.status === 'active');
        
        setSubscriptions(subscriptionsData || []); // Update the state *after* comparison

        if (!previousHasActivePlan && currentHasActivePlan) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar dashboard:', error);
      toast.error('Ocorreu um erro inesperado ao carregar o painel.');
    } finally {
      setLoading(false); // Ensure loading is always set to false
    }
  }, [navigate]); // Removed 'subscriptions' from dependencies

  useEffect(() => {
    fetchDashboardData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchDashboardData(session.user); // Pass the user directly
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
    // This should ideally navigate to a checkout page or Asaas directly
    // For now, we'll navigate to the funnel summary where plans are listed.
    navigate('/funnel/summary');
    toast('Redirecionando para a seleção de planos...'); // Changed toast.info to toast()
  };

  const handleManagePayment = () => {
    toast('Redirecionando para o painel de pagamentos Asaas (funcionalidade em breve)!'); // Changed toast.info to toast()
    // In a real scenario, you'd redirect to Asaas customer portal or a specific invoice.
  };

  const handleChangePlan = () => {
    toast('Redirecionando para a página de troca de planos (funcionalidade em breve)!'); // Changed toast.info to toast()
    // Redirect to a plan selection page
  };

  const confirmCancelSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionIdForCancellation(subscriptionId);
    setShowCancelConfirmation(true);
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscriptionIdForCancellation) return;

    setLoading(true);
    setShowCancelConfirmation(false);
    toast.loading('Cancelando assinatura...', { id: 'cancelToast' });

    try {
      // In a real scenario, you'd call your backend (Hono Edge Function)
      // which would then interact with Asaas API to cancel the subscription.
      // For now, we'll simulate a successful cancellation and update Supabase.

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', selectedSubscriptionIdForCancellation);

      if (error) {
        console.error('Erro ao cancelar assinatura no Supabase:', error);
        toast.error(`Erro ao cancelar assinatura: ${error.message}`, { id: 'cancelToast' });
      } else {
        toast.success('Assinatura cancelada com sucesso!', { id: 'cancelToast' });
        fetchDashboardData(); // Re-fetch data to update UI
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro de conexão ao cancelar assinatura.', { id: 'cancelToast' });
    } finally {
      setLoading(false);
      setSelectedSubscriptionIdForCancellation(null);
    }
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent('Olá, preciso de suporte com meu projeto no P4D Studio!');
    const phoneNumber = '5511999999999'; // Replace with actual WhatsApp number
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const displayName = userProfile?.first_name || userProfile?.email?.split('@')[0] || 'Usuário';
  const projectProgress = currentProject ? getProjectProgress(currentProject.status) : 0;
  const projectStatusText = currentProject ? getProjectStatusText(currentProject.status) : 'Nenhum projeto em andamento';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <p className="text-xl">Carregando seu painel P4D Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.1} />}

      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-purple-300/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            P4D Studio
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-700 text-sm hidden md:block">
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
                <div className="absolute right-0 mt-2 w-48 bg-gray-100 border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                  <button onClick={() => { setActiveTab('settings'); setIsAvatarMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 w-full text-left">
                    <Settings className="inline-block w-4 h-4 mr-2" /> Perfil & Configurações
                  </button>
                  <button onClick={handleLogout} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-200 w-full text-left">
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
          <p className="text-lg text-gray-700">
            {hasActivePlan ? 'Tudo pronto! Seu projeto está em produção 🚀' : 'Seu projeto está quase saindo do papel!'}
          </p>
        </div>

        {/* No Active Plan Banner */}
        {!hasActivePlan && (
          <div className="bg-red-50/50 backdrop-blur-sm border border-red-300/50 rounded-2xl p-6 text-center mb-10 animate-pulse">
            <p className="text-xl text-red-700 font-semibold mb-4">
              🚀 Seu projeto está quase saindo do papel!
            </p>
            <p className="text-lg text-gray-700 mb-6">
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
          <div className="bg-gray-100/50 border border-gray-300 rounded-full p-1 flex space-x-2">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'status' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Status do Projeto
            </button>
            <button
              onClick={() => setActiveTab('my-project')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'my-project' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Meu Projeto
            </button>
            <button
              onClick={() => setActiveTab('updates-support')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'updates-support' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Atualizações & Suporte
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
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
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" /> Status do Projeto
                </h3>
                <div className="text-center mb-6">
                  <p className="text-xl text-gray-700 mb-2">Status Atual:</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {projectStatusText}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${projectProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-right mb-6">{projectProgress}% Concluído</p>

                {hasActivePlan ? (
                  <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-300/50 rounded-xl p-4 text-center">
                    <p className="text-lg text-gray-800">
                      🎉 Parabéns! Seu plano está ativo e seu projeto já está sendo preparado pela nossa equipe.
                      Você pode acompanhar o andamento na seção "Meu Projeto".
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50/50 backdrop-blur-sm border border-red-300/50 rounded-xl p-4 text-center">
                    <p className="text-lg text-red-700 font-semibold mb-4">
                      🚀 Seu projeto está quase saindo do papel.
                    </p>
                    <p className="text-md text-gray-700 mb-4">
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
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" /> Plano Ativo
                </h3>
                {currentSubscription ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Nome do Plano:</span>
                      <span className="text-gray-900 font-semibold">{currentSubscription.plan_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Valor Mensal:</span>
                      <span className="text-green-600 font-semibold">R$ {currentSubscription.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Próxima Cobrança:</span>
                      <span className="text-gray-900 font-semibold">
                        {currentSubscription.next_due_date ? new Date(currentSubscription.next_due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Status:</span>
                      <span className={`font-semibold ${currentSubscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {currentSubscription.status === 'active' ? 'Ativo ✅' : 'Inativo 🔴'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Método de Pagamento:</span>
                      <span className="text-gray-900 font-semibold">Cartão de Crédito (Asaas)</span> {/* Placeholder */}
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
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                      >
                        Cancelar Assinatura
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <Info className="w-8 h-8 mx-auto mb-3 text-blue-600" />
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
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-600" /> Resumo do seu Projeto
                </h3>
                {funnelResponse ? (
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg leading-relaxed">
                      Com base nas suas respostas, seu projeto inclui:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      {Object.entries(funnelResponse.step_data).map(([key, value]) => {
                        if (key === 'business_type' && value) return <li key={key}>Tipo de Negócio: <span className="font-semibold text-gray-900">{value}</span></li>;
                        if (key === 'system_goal' && Array.isArray(value) && value.length > 0) return <li key={key}>Objetivos: <span className="font-semibold text-gray-900">{value.join(', ')}</span></li>;
                        if (key === 'desired_features' && Array.isArray(value) && value.length > 0) return <li key={key}>Funcionalidades Desejadas: <span className="font-semibold text-gray-900">{value.join(', ')}</span></li>;
                        if (key === 'visual_identity' && value) return <li key={key}>Identidade Visual: <span className="font-semibold text-gray-900">{value}</span></li>;
                        if (key === 'additional_notes' && value) return <li key={key}>Observações: <span className="font-semibold text-gray-900">{value}</span></li>;
                        return null;
                      })}
                    </ul>
                    {currentProject?.summary && (
                      <p className="text-lg leading-relaxed mt-4">
                        <span className="font-semibold text-blue-600">Sumário P4D:</span> {currentProject.summary}
                      </p>
                    )}
                    {currentProject?.estimated_delivery && (
                      <p className="text-lg leading-relaxed">
                        <span className="font-semibold text-green-600">Entrega Estimada:</span> {currentProject.estimated_delivery}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <Info className="w-8 h-8 mx-auto mb-3 text-blue-600" />
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
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Hourglass className="w-6 h-6 text-cyan-600" /> Linha do Tempo do Projeto
                </h3>
                <ol className="relative border-l border-gray-300 space-y-6 ml-4">
                  {timelineSteps.map((step, index) => {
                    const isActive = currentProject && projectStatusMap[currentProject.status as keyof typeof projectStatusMap]?.progress >= projectStatusMap[step.id as keyof typeof projectStatusMap]?.progress;
                    return (
                      <li key={step.id} className="mb-10 ml-6">
                        <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-gray-100 ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {step.icon}
                        </span>
                        <h4 className={`flex items-center mb-1 text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                          {step.label}
                          {isActive && <Check className="w-4 h-4 ml-2 text-green-600" />}
                        </h4>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                          {currentProject?.created_at && index === 0 ? `Iniciado em ${new Date(currentProject.created_at).toLocaleDateString('pt-BR')}` : ''}
                          {/* Add dynamic dates for other steps if available in project data */}
                        </time>
                        <p className="text-base font-normal text-gray-600">
                          {/* Dynamic description based on step */}
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
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-orange-600" /> Atualizações do Projeto
                </h3>
                <div className="space-y-6">
                  {/* Mock Data for Updates */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                      P4D
                    </div>
                    <div>
                      <p className="text-gray-700">
                        <span className="font-semibold">P4D Mídia:</span> Seu projeto entrou em fase de desenvolvimento.
                      </p>
                      <span className="text-sm text-gray-500">03/10/2024 10:30</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-900">
                      Você
                    </div>
                    <div>
                      <p className="text-gray-700">
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
                      <p className="text-gray-700">
                        <span className="font-semibold">P4D Mídia:</span> Iniciamos a integração do gateway de pagamento.
                      </p>
                      <span className="text-sm text-gray-500">05/10/2024 14:15</span>
                    </div>
                  </div>
                  {/* End Mock Data */}
                </div>
              </div>

              {/* Quick Support Card */}
              <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-3">
                  <MessageCircle className="w-6 h-6 text-green-600" /> Suporte Rápido
                </h3>
                <p className="text-lg text-gray-700 mb-6">
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
                  <a href="#" className="hover:text-blue-600 transition-colors">Acesse nossa Base de Conhecimento</a> (em breve)
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-yellow-600" /> Configurações
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Dados Pessoais</h4>
                  <p className="text-gray-700">Nome: <span className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</span></p>
                  <p className="text-gray-700">Email: <span className="font-medium">{userProfile?.email}</span></p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-600 hover:text-blue-500 text-sm">Editar Perfil</button>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Preferências de Notificação</h4>
                  <p className="text-gray-700">Receber notificações por email: <span className="font-medium">Sim</span></p>
                  <p className="text-gray-700">Receber notificações por WhatsApp: <span className="font-medium">Sim</span></p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-600 hover:text-blue-500 text-sm">Gerenciar Notificações</button>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Tema do Projeto</h4>
                  <p className="text-gray-700">Opção de alterar logotipo, cores do sistema (funcionalidade em breve!)</p>
                  <button onClick={() => toast('Funcionalidade em breve!')} className="mt-3 text-blue-600 hover:text-blue-500 text-sm">Personalizar Tema</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200 max-w-md w-full text-center">
            <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Cancelamento</h3>
            <p className="text-gray-700 mb-6">
              Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-all duration-200"
              >
                Não, Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200"
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