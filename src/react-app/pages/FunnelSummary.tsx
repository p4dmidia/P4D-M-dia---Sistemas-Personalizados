"use client";

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface FunnelSummaryState {
  formData: Record<string, any>;
  funnelId: string;
}

export default function FunnelSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, funnelId } = (location.state as FunnelSummaryState) || {};
  const [summaryText, setSummaryText] = useState<string>('Gerando resumo do seu projeto...');
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder for plans (should ideally come from an API)
  const plans = [
    {
      name: '🟦 Site Institucional',
      price: 'R$ 29,90',
      description: 'Perfeito para empresas e profissionais que desejam uma presença digital moderna e profissional',
      features: [
        'Página institucional completa (Home, Sobre, Serviços e Contato)',
        'Layout responsivo (desktop, tablet e celular)',
        'Integração com WhatsApp e formulário de contato',
        'Hospedagem inclusa',
        'Suporte via WhatsApp'
      ],
      asaasId: 'asaas_plan_site', // Placeholder Asaas ID
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      name: '🟩 E-commerce ou Landing Page de Alta Conversão',
      price: 'R$ 49,90',
      description: 'Feito para quem quer vender online ou gerar leads todos os dias',
      features: [
        'Loja virtual ou landing page personalizada',
        'Integração com meios de pagamento',
        'Otimização para conversão e tráfego pago',
        'Hospedagem e suporte inclusos'
      ],
      asaasId: 'asaas_plan_ecommerce', // Placeholder Asaas ID
      color: 'from-green-500 to-green-600',
      borderColor: 'border-green-500'
    },
    {
      name: '🟧 Cardápio Digital para Delivery',
      price: 'R$ 79,90',
      description: 'Ideal para restaurantes e lanchonetes que querem digitalizar o atendimento',
      features: [
        'Cardápio digital interativo com fotos e preços',
        'Link direto para pedidos via WhatsApp',
        'Painel para editar produtos',
        'Layout responsivo',
        'Hospedagem e suporte inclusos'
      ],
      asaasId: 'asaas_plan_menu', // Placeholder Asaas ID
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-500'
    },
    {
      name: '🟪 E-commerce com Afiliados / Clube de Assinatura / Pontuação por CPF',
      price: 'R$ 119,90',
      description: 'Transforme seu negócio em um sistema de vendas completo',
      features: [
        'Loja virtual personalizada',
        'Área de afiliados e controle de comissões',
        'Clube de assinatura',
        'Sistema de pontos e fidelidade por CPF',
        'Hospedagem e suporte inclusos'
      ],
      asaasId: 'asaas_plan_affiliate', // Placeholder Asaas ID
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      name: '🟥 CRM, Sistemas Internos e Cashback',
      price: 'R$ 149,90',
      description: 'Controle total do seu negócio em um único painel',
      features: [
        'CRM com gestão de clientes e pipeline',
        'Controle interno e financeiro',
        'Módulo de cashback personalizável',
        'Hospedagem e suporte técnico'
      ],
      asaasId: 'asaas_plan_crm', // Placeholder Asaas ID
      color: 'from-red-500 to-red-600',
      borderColor: 'border-red-500'
    },
    {
      name: '🟫 Sistemas com Inteligência Artificial',
      price: 'A partir de R$ 199,90',
      description: 'A era da IA chegou, e sua empresa pode estar à frente',
      features: [
        'Chatbots e agentes inteligentes (LLM)',
        'Marketplaces personalizados',
        'Áreas de membros e dashboards inteligentes',
        'Desenvolvimento sob medida',
        'Hospedagem e suporte premium',
        'Preço sob consulta conforme complexidade'
      ],
      asaasId: 'asaas_plan_ai', // Placeholder Asaas ID
      color: 'from-amber-600 to-orange-700',
      borderColor: 'border-amber-600'
    }
  ];

  useEffect(() => {
    if (!formData || !funnelId) {
      toast.error('Dados do funil não encontrados. Por favor, preencha o funil novamente.');
      navigate('/funnel');
      return;
    }

    // Simulate AI summary generation and plan recommendation
    const generateSummaryAndRecommendPlan = () => {
      // This is a simplified example. In a real app, you'd send formData to your Hono backend
      // which would then use an LLM (like OpenAI, Gemini, etc.) to generate the summary
      // and recommend a plan based on the features/goals.

      const businessType = formData.business_type || 'seu negócio';
      const systemGoal = Array.isArray(formData.system_goal) ? formData.system_goal.join(', ').toLowerCase() : formData.system_goal;
      const desiredFeatures = Array.isArray(formData.desired_features) ? formData.desired_features.join(', ').toLowerCase() : formData.desired_features;
      const companyName = formData.company_name || 'sua empresa'; // Assuming a step for company name

      let generatedSummary = `Perfeito! Vamos criar um sistema para ${companyName} com foco em ${systemGoal || 'otimizar suas operações'}.`;
      generatedSummary += ` Ele incluirá funcionalidades como: ${desiredFeatures || 'as que você descreveu'}.`;
      generatedSummary += ` Entrega estimada em até 7 dias úteis (pode variar conforme complexidade).`;
      generatedSummary += ` Seu sistema virá hospedado, otimizado e com suporte direto via WhatsApp.`;

      setSummaryText(generatedSummary);

      // Simple plan recommendation logic
      let recommended = plans[0]; // Default to Site Institucional
      if (desiredFeatures.includes('e-commerce') || businessType.includes('e-commerce')) {
        recommended = plans[1];
      } else if (businessType.includes('restaurant')) {
        recommended = plans[2];
      } else if (desiredFeatures.includes('affiliate') || desiredFeatures.includes('assinatura') || desiredFeatures.includes('pontos')) {
        recommended = plans[3];
      } else if (desiredFeatures.includes('crm') || desiredFeatures.includes('interno')) {
        recommended = plans[4];
      } else if (desiredFeatures.includes('inteligência artificial')) {
        recommended = plans[5];
      }
      setRecommendedPlan(recommended.name);
      setLoading(false);
    };

    generateSummaryAndRecommendPlan();
  }, [formData, funnelId, navigate]);

  const handleSelectPlan = (planName: string, asaasId: string) => {
    // Here you would navigate to the registration/checkout page
    // passing the selected plan details and funnelId
    navigate('/register', { state: { selectedPlan: planName, asaasPlanId: asaasId, funnelId } });
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
                onClick={() => handleSelectPlan(plan.name, plan.asaasId)}
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