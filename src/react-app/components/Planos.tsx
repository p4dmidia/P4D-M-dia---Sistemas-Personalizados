import { Check, Star } from 'lucide-react';

export default function Planos() {
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
      popular: false,
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
      popular: true,
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
      popular: false,
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
      popular: false,
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
      popular: false,
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
      popular: false,
      color: 'from-amber-600 to-orange-700',
      borderColor: 'border-amber-600'
    }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="planos" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Planos de Soluções Digitais
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Escolha o plano ideal para o tamanho do seu negócio
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-2 ${plan.borderColor} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
                plan.popular ? 'lg:scale-110 shadow-2xl shadow-blue-500/20' : 'hover:shadow-xl'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
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

              {/* Features */}
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

              {/* CTA Button */}
              <button
                onClick={() => scrollToSection('contato')}
                className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  plan.popular ? 'shadow-lg hover:shadow-blue-500/25' : ''
                }`}
              >
                Contratar Agora
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Todos os planos incluem:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Setup gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Sem taxa de cancelamento</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Atualizações inclusas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Garantia de 30 dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
