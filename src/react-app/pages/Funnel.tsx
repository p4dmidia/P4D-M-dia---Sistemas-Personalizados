"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FunnelProgressBar from '@/react-app/components/FunnelProgressBar';
import { FunnelResponse } from '@/shared/types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient'; // Changed import

// Define the structure for each funnel step
interface FunnelStep {
  id: string;
  title: string;
  description: string;
  options?: { value: string; label: string }[];
  inputType: 'checkbox' | 'radio' | 'text' | 'textarea';
  placeholder?: string;
  allowMultiple?: boolean;
}

export const funnelSteps: FunnelStep[] = [ // Exported funnelSteps
  {
    id: 'business_type',
    title: 'Sobre o seu negócio',
    description: 'Qual o principal tipo de negócio que você possui?',
    inputType: 'radio',
    options: [
      { value: 'e-commerce', label: 'E-commerce / Loja Virtual' },
      { value: 'service_provider', label: 'Prestador de Serviços' },
      { value: 'restaurant', label: 'Restaurante / Delivery' },
      { value: 'digital_product', label: 'Produto Digital / Infoprodutor' },
      { value: 'startup', label: 'Startup / Tecnologia' },
      { value: 'other', label: 'Outro (especificar)' },
    ],
  },
  {
    id: 'system_goal',
    title: 'Qual o objetivo principal do sistema?',
    description: 'O que você espera alcançar com esta solução?',
    inputType: 'checkbox',
    allowMultiple: true,
    options: [
      { value: 'increase_sales', label: 'Aumentar vendas e faturamento' },
      { value: 'generate_leads', label: 'Gerar mais leads qualificados' },
      { value: 'automate_processes', label: 'Automatizar processos internos' },
      { value: 'improve_customer_experience', label: 'Melhorar a experiência do cliente' },
      { value: 'manage_clients', label: 'Gerenciar clientes (CRM)' },
      { value: 'launch_new_product', label: 'Lançar um novo produto/serviço' },
      { value: 'other', label: 'Outro (especificar)' },
    ],
  },
  {
    id: 'desired_features',
    title: 'Quais funcionalidades você deseja?',
    description: 'Selecione as principais características que seu sistema deve ter.',
    inputType: 'checkbox',
    allowMultiple: true,
    options: [
      { value: 'payment_gateway', label: 'Integração com meios de pagamento (cartão, PIX)' },
      { value: 'user_login', label: 'Login e cadastro de usuários' },
      { value: 'admin_panel', label: 'Painel administrativo para gestão' },
      { value: 'affiliate_system', label: 'Sistema de afiliados' },
      { value: 'subscription_club', label: 'Clube de assinatura' },
      { value: 'loyalty_program', label: 'Programa de fidelidade/pontos' },
      { value: 'crm_features', label: 'Recursos de CRM (gestão de clientes)' },
      { value: 'ai_integration', label: 'Integração com Inteligência Artificial (chatbots, automação)' },
      { value: 'custom_reports', label: 'Relatórios e dashboards personalizados' },
      { value: 'other', label: 'Outras funcionalidades (descrever)' },
    ],
  },
  {
    id: 'visual_identity',
    title: 'Identidade Visual',
    description: 'Conte-nos sobre as cores, logotipo e estilo que você prefere.',
    inputType: 'textarea',
    placeholder: 'Ex: Cores azul e branco, logo moderno, estilo minimalista...',
  },
  {
    id: 'additional_notes',
    title: 'Observações Finais',
    description: 'Alguma informação adicional, prazo específico ou detalhe importante?',
    inputType: 'textarea',
    placeholder: 'Ex: Preciso do sistema pronto em 30 dias, tenho um exemplo de site que gosto...',
  },
];

export default function Funnel() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const currentStep = funnelSteps[currentStepIndex]; // Define currentStep here

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getSession();

    // Correctly destructure the subscription object
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe(); // Correctly unsubscribe
    };
  }, []);

  const saveFunnelResponse = useCallback(async (dataToSave: Record<string, any>, step: number, completed: boolean = false) => {
    try {
      let response;
      if (funnelId) {
        // Update existing funnel response
        const updatePayload = {
          user_id: userId,
          step_data: dataToSave,
          current_step: step,
          completed: completed,
          updated_at: new Date().toISOString(), // Explicitly set updated_at for updates
        };
        response = await supabase
          .from('funnel_responses')
          .update(updatePayload)
          .eq('id', funnelId)
          .select()
          .single();
      } else {
        // Insert new funnel response
        const insertPayload = {
          user_id: userId,
          step_data: dataToSave,
          current_step: step,
          completed: completed,
        };
        response = await supabase
          .from('funnel_responses')
          .insert(insertPayload) // id is not included, so default will be used
          .select()
          .single();
      }

      if (response.error) {
        console.error('Supabase save funnel error:', response.error);
        toast.error(`Erro ao salvar progresso: ${response.error.message}`);
        return;
      }

      setFunnelId(response.data.id);
      // toast.success('Progresso salvo automaticamente!'); // Too many toasts
    } catch (error) {
      console.error('Autosave failed:', error);
      toast.error('Erro de conexão ao salvar progresso.');
    }
  }, [funnelId, userId]);

  // Load existing funnel data on component mount
  useEffect(() => {
    const loadFunnelData = async () => {
      setLoading(true);
      try {
        let funnelResponse: FunnelResponse | null = null;

        if (funnelId) {
          const { data, error } = await supabase
            .from('funnel_responses')
            .select('*')
            .eq('id', funnelId)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          funnelResponse = data;
        } else if (userId) {
          const { data, error } = await supabase
            .from('funnel_responses')
            .select('*')
            .eq('user_id', userId)
            .eq('completed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          funnelResponse = data;
        }

        if (funnelResponse) {
          setFunnelId(funnelResponse.id!);
          setFormData(funnelResponse.step_data);
          setCurrentStepIndex(funnelResponse.current_step);
        } else {
          setFunnelId(null);
          setFormData({});
          setCurrentStepIndex(0);
        }
      } catch (error: any) {
        console.error('Error loading funnel data:', error);
        toast.error(`Erro ao carregar progresso: ${error.message || 'Erro de conexão.'}`);
        setFunnelId(null);
        setFormData({});
        setCurrentStepIndex(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId !== null) { // Only run once userId is determined (not null, not undefined)
      loadFunnelData();
    }
  }, [funnelId, userId]); // Re-run if funnelId or userId changes

  // Autosave on formData or currentStepIndex change
  useEffect(() => {
    if (!loading) {
      const handler = setTimeout(() => {
        saveFunnelResponse(formData, currentStepIndex);
      }, 1000); // Save 1 second after user stops typing/changing
      return () => clearTimeout(handler);
    }
  }, [formData, currentStepIndex, loading, saveFunnelResponse]);

  const handleOptionChange = (stepId: string, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[stepId] || (currentStep.allowMultiple ? [] : '');
      let newValues;

      if (currentStep.allowMultiple) {
        newValues = Array.isArray(currentValues)
          ? (currentValues.includes(value)
            ? currentValues.filter((item: string) => item !== value)
            : [...currentValues, value])
          : [value];
      } else {
        newValues = value;
      }
      return { ...prev, [stepId]: newValues };
    });
  };

  const handleTextChange = (stepId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [stepId]: value }));
  };

  const handleNext = () => {
    if (currentStepIndex < funnelSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Funnel completed, navigate to summary/plan selection
      saveFunnelResponse(formData, currentStepIndex, true); // Mark as completed
      navigate('/funnel/summary', { state: { formData, funnelId } });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      navigate('/'); // Go back to home page if on first step
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Carregando seu progresso...</p>
      </div>
    );
  }

  if (!currentStep) {
    console.error("Funnel: currentStep is undefined. currentStepIndex:", currentStepIndex);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-xl text-red-500 mb-4">Erro ao carregar etapa do funil. Por favor, tente novamente.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl w-full bg-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700 relative">
        <FunnelProgressBar currentStep={currentStepIndex} totalSteps={funnelSteps.length} />

        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {currentStep.title}
          </h2>
          <p className="text-lg text-gray-300">{currentStep.description}</p>
        </div>

        <div className="space-y-6 mb-10">
          {currentStep.inputType === 'radio' && currentStep.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStep.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200
                    ${formData[currentStep.id] === option.value
                      ? 'bg-blue-800/30 border-blue-500 text-blue-300 shadow-md'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                    }`}
                >
                  <input
                    type="radio"
                    name={currentStep.id}
                    value={option.value}
                    checked={formData[currentStep.id] === option.value}
                    onChange={() => handleOptionChange(currentStep.id, option.value)}
                    className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {currentStep.inputType === 'checkbox' && currentStep.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStep.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200
                    ${Array.isArray(formData[currentStep.id]) && formData[currentStep.id].includes(option.value)
                      ? 'bg-purple-800/30 border-purple-500 text-purple-300 shadow-md'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                    }`}
                >
                  <input
                    type="checkbox"
                    name={currentStep.id}
                    value={option.value}
                    checked={Array.isArray(formData[currentStep.id]) && formData[currentStep.id].includes(option.value)}
                    onChange={() => handleOptionChange(currentStep.id, option.value)}
                    className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 rounded"
                  />
                  <span className="ml-3 text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {(currentStep.inputType === 'text' || currentStep.inputType === 'textarea') && (
            <textarea
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={currentStep.inputType === 'textarea' ? 5 : 1}
              placeholder={currentStep.placeholder}
              value={formData[currentStep.id] || ''}
              onChange={(e) => handleTextChange(currentStep.id, e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200"
          >
            {currentStepIndex === funnelSteps.length - 1 ? 'Ver Resumo' : 'Próximo'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}