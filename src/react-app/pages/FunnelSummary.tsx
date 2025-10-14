"use client";

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import type { FunnelResponse } from '@/shared/types'; // Importado como tipo
import { funnelSteps } from '@/react-app/pages/Funnel';
import { Check, Star } from 'lucide-react';

// Definir tipos para os dados do Stripe que serão buscados
interface StripeProduct {
  id: string; // UUID interno do Supabase
  stripe_product_id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, any> | null;
  prices: StripePrice[]; // Relação com os preços
}

interface StripePrice {
  id: string; // UUID interno do Supabase
  stripe_price_id: string;
  product_id: string; // UUID interno do produto
  active: boolean;
  unit_amount: number; // Já em reais
  currency: string;
  type: string;
  interval: string | null;
  interval_count: number | null;
  metadata: Record<string, any> | null;
}

// Tipo para o plano com detalhes de preço
type PlanWithPriceDetails = StripeProduct & { price_details: StripePrice };

export default function FunnelSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  // Ajustado o tipo de formData para usar FunnelResponse['step_data']
  const [formData, setFormData] = useState<FunnelResponse['step_data']>(location.state?.formData || {});
  const [funnelId, setFunnelId] = useState<string | null>(location.state?.funnelId || null);
  const [summaryText, setSummaryText] = useState<string>('Gerando resumo do seu projeto...');
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanWithPriceDetails[]>([]); // Estado para armazenar os planos do Supabase

  // Helper function to get the label for a given value and step ID
  const getOptionLabel = (stepId: string, value: string): string => {
    const step = funnelSteps.find(s => s.id === stepId);
    if (step && step.options) {
      const option = step.options.find(o => o.value === value);
      return option ? option.label : value;
    }
    return value;
  };

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
      setUserEmail(user.email || null); // Garante que user.email é string ou null
    };
    checkAuthAndSetUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null); // Garante que session.user.email é string ou null
      } else {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Effect to load funnel data if not from location.state AND fetch plans from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Load existing funnel data if needed
        if (userId && Object.keys(formData).length === 0) {
          const { data: funnelResponse, error: funnelError } = await supabase
            .from('funnel_responses')
            .select('*')
            .eq('user_id', userId)
            .eq('completed', false)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (funnelError && funnelError.code !== 'PGRST116') {
            console.error('Error loading existing funnel for user:', funnelError);
            toast.error('Erro ao carregar seu progresso anterior.');
          } else if (funnelResponse) {
            setFunnelId(funnelResponse.id!);
            setFormData(funnelResponse.step_data);
          }
        }

        // 2. Fetch active products and their prices from Supabase
        const { data: productsWithPrices, error: fetchError } = await supabase
          .from('products')
          .select('*, prices(*)')
          .eq('active', true)
          .order('created_at', { ascending: true }); // Order by creation date for consistent display

        if (fetchError) {
          console.error('Error fetching products and prices:', fetchError);
          toast.error('Erro ao carregar os planos disponíveis.');
          setAvailablePlans([]);
        } else {
          // Filter out products without active prices or with multiple prices (for simplicity, take the first active)
          const formattedPlans = productsWithPrices
            .map(product => {
              const activePrice = product.prices.find((price: StripePrice) => price.active); // Tipado price
              if (activePrice) {
                return {
                  ...product,
                  price_details: activePrice, // Attach the active price details
                };
              }
              return null;
            })
            .filter(Boolean) as PlanWithPriceDetails[];
          
          setAvailablePlans(formattedPlans);
        }
      } catch (err) {
        console.error('Unexpected error loading data:', err);
        toast.error('Erro inesperado ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    if (userId !== null) {
      loadData();
    }
  }, [userId, formData]); // Adicionado formData às dependências para re-executar se o estado inicial for vazio

  // Effect to generate summary and recommend plan (now using availablePlans)
  useEffect(() => {
    if (!loading && availablePlans.length > 0) {
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

        // Logic for plan recommendation based on translated features and availablePlans
        let recommended = availablePlans[0]; // Default to the first available plan
        
        // Example recommendation logic (adjust as needed)
        if (desiredFeaturesRaw.includes('e-commerce') || businessTypeRaw === 'e-commerce') {
          const ecommercePlan = availablePlans.find(p => p.name.includes('E-commerce'));
          if (ecommercePlan) recommended = ecommercePlan;
        } else if (businessTypeRaw === 'restaurant') {
          const restaurantPlan = availablePlans.find(p => p.name.includes('Cardápio Digital'));
          if (restaurantPlan) recommended = restaurantPlan;
        } else if (desiredFeaturesRaw.includes('affiliate_system') || desiredFeaturesRaw.includes('subscription_club') || desiredFeaturesRaw.includes('loyalty_program')) {
          const affiliatePlan = availablePlans.find(p => p.name.includes('Afiliados'));
          if (affiliatePlan) recommended = affiliatePlan;
        } else if (desiredFeaturesRaw.includes('crm_features') || desiredFeaturesRaw.includes('internal_systems')) {
          const crmPlan = availablePlans.find(p => p.name.includes('CRM'));
          if (crmPlan) recommended = crmPlan;
        } else if (desiredFeaturesRaw.includes('ai_integration')) {
          const aiPlan = availablePlans.find(p => p.name.includes('Inteligência Artificial'));
          if (aiPlan) recommended = aiPlan;
        }
        setRecommendedPlan(recommended?.name || null);
      };

      generateSummaryAndRecommendPlan();
    }
  }, [formData, loading, availablePlans, getOptionLabel]);

  const handleSelectPlan = async (plan: PlanWithPriceDetails) => { // Tipado plan
    if (!userId || !userEmail) {
      toast.error('Usuário não autenticado. Por favor, faça login.', { id: 'stripe-checkout' });
      navigate('/login');
      return;
    }

    setLoading(true);
    toast.loading('Preparando seu checkout Stripe...', { id: 'stripe-checkout' });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
          priceId: plan.price_details.stripe_price_id, // Usar o ID do preço do Stripe
          planName: plan.name,
          amount: plan.price_details.unit_amount, // Usar o valor do preço
          funnelResponseId: funnelId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Frontend: Failed to create Stripe checkout session:', errorData);
        toast.error(errorData.error || 'Erro ao criar sessão de checkout do Stripe.', { id: 'stripe-checkout' });
        setLoading(false);
        return;
      }

      const { url } = await response.json();
      toast.success('Redirecionando para o pagamento...', { id: 'stripe-checkout' });
      
      window.location.href = url;

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
          {availablePlans.length === 0 ? (
            <p className="text-center text-gray-400 text-lg col-span-full">Nenhum plano disponível no momento. Por favor, tente novamente mais tarde.</p>
          ) : (
            availablePlans.map((plan, _index) => ( // Alterado index para _index
              <div
                key={plan.id}
                className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-2 ${plan.name === recommendedPlan ? 'border-blue-500' : 'border-gray-700'} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
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
                      R$ {plan.price_details.unit_amount.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-400 text-lg">/mês</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {/* Features from metadata or hardcoded if not available */}
                  {(plan.metadata?.features as string[] || []).map((feature: string, featureIndex: number) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    plan.name === recommendedPlan ? 'shadow-lg hover:shadow-blue-500/25' : ''
                  }`}
                >
                  Ativar meu projeto com este plano
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}