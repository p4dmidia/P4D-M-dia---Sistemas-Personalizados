"use client";

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient'; // Import supabase client
import { FunnelResponse } from '@/shared/types'; // Import FunnelResponse type
import { funnelSteps } from '@/react-app/pages/Funnel'; // Import funnelSteps from Funnel.tsx

interface FunnelSummaryState {
  formData: Record<string, any>;
  funnelId: string;
}

export default function FunnelSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize with state if available, otherwise empty object/null
  const [formData, setFormData] = useState<Record<string, any>>(location.state?.formData || {});
  const [funnelId, setFunnelId] = useState<string | null>(location.state?.funnelId || null);
  const [summaryText, setSummaryText] = useState<string>('Gerando resumo do seu projeto...');
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); // Track user ID

  // Helper function to get the label for a given value and step ID
  const getOptionLabel = (stepId: string, value: string): string => {
    const step = funnelSteps.find(s => s.id === stepId);
    if (step && step.options) {
      const option = step.options.find(o => o.value === value);
      return option ? option.label : value; // Return label if found, otherwise the raw value
    }
    return value;
  };

  // Placeholder for plans (should ideally come from an API)
  const plans = [
    {
      name: '🟦 Site Institucional',
      price: 'R$ 29,90',
      amount: 29.90,
      description: 'Perfeito para empresas e profissionais que desejam uma presença digital moderna e profissional',
      features: [
        'Página institucional completa (Home, Sobre, Serviços e Contato)',
        'Layout responsivo (desktop, tablet e celular)',
        'Integração com WhatsApp e formulário de contato',
        'Hospedagem inclusa',
        'Suporte via WhatsApp'
      ],
      stripePriceId: 'prod_TDTse4ZbMPxKAx', // Placeholder Stripe Price ID
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      name: '🟩 E-commerce ou Landing Page de Alta Conversão',
      price: 'R$ 49,90',
      amount: 49.90,
      description: 'Feito para quem quer vender online ou gerar leads todos os dias',
      features: [
        'Loja virtual ou landing page personalizada',
        'Integração com meios de pagamento',
        'Otimização para conversão e tráfego pago',
        'Hospedagem e suporte inclusos'
      ],
      stripePriceId: 'price_123_ecommerce', // Placeholder Stripe Price ID
      color: 'from-green-500 to-green-600',
      borderColor: 'border-green-500'
    },
    {
      name: '🟧 Cardápio Digital para Delivery',
      price: 'R$ 79,90',
      amount: 79.90,
      description: 'Ideal para restaurantes e lanchonetes que querem digitalizar o atendimento',
      features: [
        'Cardápio digital interativo com fotos e preços',
        'Link direto para pedidos via WhatsApp',
        'Painel para editar produtos',
        'Layout responsivo',
        'Hospedagem e suporte inclusos'
      ],
      stripePriceId: 'price_123_menu', // Placeholder Stripe Price ID
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-500'
    },
    {
      name: '🟪 E-commerce com Afiliados / Clube de Assinatura / Pontuação por CPF',
      price: 'R$ 119,90',
      amount: 119.90,
      description: 'Transforme seu negócio em um sistema de vendas completo',
      features: [
        'Loja virtual personalizada',
        'Área de afiliados e controle de comissões',
        'Clube de assinatura',
        'Sistema de pontos e fidelidade por CPF',
        'Hospedagem e suporte inclusos'
      ],
      stripePriceId: 'price_123_affiliate', // Placeholder Stripe Price ID
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      name: '🟥 CRM, Sistemas Internos e Cashback',
      price: 'R$ 149,90',
      amount: 149.90,
      description: 'Controle total do seu negócio em um único painel',
      features: [
        'CRM com gestão de clientes e pipeline',
        'Controle interno e financeiro',
        'Módulo de cashback personalizável',
        'Hospedagem e suporte técnico'
      ],
      stripePriceId: 'price_123_crm', // Placeholder Stripe Price ID
      color: 'from-red-500 to-red-600',
      borderColor: 'border-red-500'
    },
    {
      name: '🟫 Sistemas com Inteligência Artificial',
      price: 'A partir de R$ 199,90',
      amount: 199.90,
      description: 'A era da IA chegou, e sua empresa pode estar à frente',
      features: [
        'Chatbots e agentes inteligentes (LLM)',
        'Marketplaces personalizados',
        'Áreas de membros e dashboards inteligentes',
        'Desenvolvimento sob medida',
        'Hospedagem e suporte premium',
        'Preço sob consulta conforme complexidade'
      ],
      stripePriceId: 'price_123_ai', // Placeholder Stripe Price ID
      color: 'from-amber-600 to-orange-700',
      borderColor: 'border-amber-600'
    }
  ];

  // Effect to get user ID and redirect if not authenticated
  useEffect(() => {
    const checkAuthAndSetUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error('Você precisa estar logado para ativar um plano.');
        navigate('/login');
        return;
      }
      setUserId(user.id);
    };
    checkAuthAndSetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Effect to load funnel data if not from location.state
  useEffect(() => {
    const loadExistingFunnel = async () => {
      // Only attempt to load if userId is known and no funnel data is present from location.state
      // and if formData is still empty (meaning it wasn't passed via state)
      if (userId && Object.keys(formData).length === 0) {
        setLoading(true);
        try {
          const { data: funnelResponse, error } = await supabase
            .from('funnel_responses')
            .select('*')
            .eq('user_id', userId)
            .eq('completed', false) // Look for incomplete funnels
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
            console.error('Error loading existing funnel for user:', error);
            toast.error('Erro ao carregar seu progresso anterior.');
          } else if (funnelResponse) {
            setFunnelId(funnelResponse.id!);
            setFormData(funnelResponse.step_data);
          }
        } catch (err) {
          console.error('Unexpected error loading funnel:', err);
          toast.error('Erro inesperado ao carregar progresso.');
        } finally {
          setLoading(false);
        }
      } else if (!userId && Object.keys(formData).length === 0) {
        // If no user and no funnel data from state, proceed to show plans with generic summary
        setLoading(false);
      } else {
        // If formData is already present from state, or userId is null and formData is not empty, stop loading
        setLoading(false); 
      }
    };

    if (userId !== null) { // Only run once userId is determined (not null, not undefined)
      loadExistingFunnel();
    }
  }, [userId]); // Depend only on userId to trigger loading of existing funnel data

  // Effect to generate summary and recommend plan
  useEffect(() => {
    if (!loading) { // Only generate summary once loading is complete
      const generateSummaryAndRecommendPlan = () => {
        const businessTypeRaw = formData.business_type;
        const businessType = businessTypeRaw ? getOptionLabel('business_type', businessTypeRaw) : 'seu negócio';

        const systemGoalRaw = Array.isArray(formData.system_goal) ? formData.system_goal : [];
        const systemGoal = systemGoalRaw.length > 0
          ? systemGoalRaw.map((val: string) => getOptionLabel('system_goal', val)).join(', ').toLowerCase()
          : 'otimizar suas operações';

        const desiredFeaturesRaw = Array.isArray(formData.desired_features) ? formData.desired_features : [];
        const desiredFeatures = desiredFeaturesRaw.length > 0
          ? desiredFeaturesRaw.map((val: string) => getOptionLabel('desired_features', val)).join(', ').toLowerCase()
          : 'as funcionalidades que você descreveu';
        
        const visualIdentity = formData.visual_identity;
        const additionalNotes = formData.additional_notes;

        let generatedSummary = `Perfeito! Vamos criar um sistema para ${businessType} com foco em ${systemGoal}.`;
        generatedSummary += ` Ele incluirá funcionalidades como: ${desiredFeatures}.`;
        if (visualIdentity) {
          generatedSummary += ` Sua identidade visual terá como base: ${visualIdentity}.`;
        }
        if (additionalNotes) {
          generatedSummary += ` Observações adicionais: ${additionalNotes}.`;
        }
        generatedSummary += ` Entrega estimada em até 7 dias úteis (pode variar conforme complexidade).`;
        generatedSummary += ` Seu sistema virá hospedado, otimizado e com suporte direto via WhatsApp.`;

        // If formData is empty, provide a more generic summary
        if (Object.keys(formData).length === 0) {
          generatedSummary = "Explore nossos planos e encontre a solução perfeita para o seu negócio. Estamos prontos para transformar suas ideias em realidade!";
        }

        setSummaryText(generatedSummary);

        let recommended = plans[0]; // Default to Site Institucional
        // Logic for plan recommendation based on translated features
        if (desiredFeaturesRaw.includes('e-commerce') || businessTypeRaw === 'e-commerce') {
          recommended = plans[1];
        } else if (businessTypeRaw === 'restaurant') {
          recommended = plans[2];
        } else if (desiredFeaturesRaw.includes('affiliate_system') || desiredFeaturesRaw.includes('subscription_club') || desiredFeaturesRaw.includes('loyalty_program')) {
          recommended = plans[3];
        } else if (desiredFeaturesRaw.includes('crm_features') || desiredFeaturesRaw.includes('internal_systems')) { // Assuming 'internal_systems' is a possible raw value
          recommended = plans[4];
        } else if (desiredFeaturesRaw.includes('ai_integration')) {
          recommended = plans[5];
        }
        setRecommendedPlan(recommended.name);
      };

      generateSummaryAndRecommendPlan();
    }
  }, [formData, loading]); // Depend on formData and loading

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    setLoading(true);
    toast.loading('Preparando seu checkout Stripe...', { id: 'stripe-checkout' });

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou ou não está ativa. Por favor, faça login novamente.', { id: 'stripe-checkout' });
        navigate('/login');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan_name: plan.name,
          stripe_price_id: plan.stripePriceId,
          funnel_response_id: funnelId, // Pass funnelId if available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Frontend: Failed to create Stripe checkout session:', errorData);
        toast.error(errorData.error || 'Erro ao criar sessão de checkout do Stripe.', { id: 'stripe-checkout' });
        setLoading(false);
        return;
      }

      const { checkoutUrl } = await response.json();
      toast.success('Redirecionando para o pagamento...', { id: 'stripe-checkout' });
      
      // Redirect to Stripe checkout page
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Frontend: Error during Stripe checkout session creation:', error);
      toast.error('Erro de conexão ao ativar o plano.', { id: 'stripe-checkout' });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Gerando seu resumo e recomendação de plano...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-4xl w-full bg-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700 relative">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Perfeito, já entendemos o que você precisa!
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Com base nas suas respostas, preparamos um resumo do seu projeto e uma recomendação de plano.
          </p>
        </div>

        {/* Project Summary */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 mb-12">
          <p className="text-xl text-gray-200 leading-relaxed mb-4">
            {summaryText}
          </p>
          <ul className="text-gray-300 text-lg space-y-2">
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Hospedagem inclusa</li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Suporte direto via WhatsApp</li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Entrega rápida</li>
            <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> 15 dias de garantia incondicional</li>
          </ul>
        </div>

        {/* Plan Selection */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Escolha seu plano
          </h3>
          <p className="text-lg text-gray-400">
            Selecione o plano que melhor se encaixa no seu projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-2 ${plan.borderColor} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
                plan.name === recommendedPlan ? 'lg:scale-105 shadow-2xl shadow-blue-500/20' : 'hover:shadow-xl'
              }`}
            >
              {plan.name === recommendedPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Recomendado para você
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-lg">/mês</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  plan.name === recommendedPlan ? 'shadow-lg hover:shadow-blue-500/25' : ''
                }`}
              >
                Ativar meu projeto com este plano
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}