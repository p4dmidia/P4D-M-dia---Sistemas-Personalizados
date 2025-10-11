import { TrendingUp, Users, DollarSign, Target, BarChart3, MessageSquare } from 'lucide-react';
// Removed useNavigate as it's no longer needed for these buttons

export default function AssessoriaMarketing() {
  // Removed useNavigate initialization

  const services = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Estratégia e Planejamento',
      description: 'Planejamento completo de marketing digital orientado a resultados'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Gestão de Campanhas',
      description: 'Meta Ads, Google Ads, TikTok Ads e Pinterest Ads otimizados para conversão'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Inbound Marketing',
      description: 'E-mail marketing e automação de funil para nutrição de leads'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Landing Pages',
      description: 'Desenvolvimento de páginas e sistemas de alta conversão'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Consultoria Estratégica',
      description: 'Orientação para crescimento e escala do seu negócio'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Foco em ROI',
      description: 'Relatórios claros focados em aumento de receita'
    }
  ];

  const steps = [
    { number: '1', title: 'Captação de novos clientes', description: 'Atraímos leads qualificados para seu negócio' },
    { number: '2', title: 'Fidelização dos atuais', description: 'Estratégias para reter e engajar sua base' },
    { number: '3', title: 'Aumento do ticket médio', description: 'Maximizamos o valor por cliente' },
    { number: '4', title: 'Escala do faturamento', description: 'Crescimento sustentável e previsível' }
  ];

  // Removed scrollToSection as it's no longer needed for these buttons
  // Removed handleStartFunnel as it's no longer needed for these buttons

  const handleWhatsAppClick = () => {
    window.open('https://w.app/k5ws4g', '_blank');
  };

  return (
    <section id="assessoria-marketing" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Assessoria de Marketing Digital
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Mais do que tráfego, entregamos resultados reais.
          </p>
          <p className="text-lg text-gray-400 max-w-4xl mx-auto">
            Enquanto outros vendem curtidas e seguidores, nós entregamos o que realmente importa: <span className="text-green-400 font-bold">aumento de receita.</span>
          </p>
        </div>

        {/* Main Description */}
        <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 mb-16">
          <p className="text-lg text-gray-300 leading-relaxed text-center max-w-4xl mx-auto mb-6">
            Nosso time de especialistas atua em todas as etapas da jornada do cliente — desde a atração até a recompra — com um objetivo claro: <span className="text-blue-400 font-bold">gerar faturamento previsível e sustentável.</span>
          </p>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              O que fazemos:
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">{service.title}</h4>
                <p className="text-gray-400">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Process Steps */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Como entregamos resultado:
            </span>
          </h3>
          <p className="text-lg text-gray-400 text-center mb-8">
            Cuidamos de todas as etapas do processo:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {step.number}
                </div>
                <h4 className="text-lg font-semibold text-white mb-3">{step.title}</h4>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final Statement */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center mb-8">
          <p className="text-xl text-gray-200 mb-6">
            Tudo isso com relatórios claros, focados em uma métrica: <span className="text-green-400 font-bold text-2xl">aumento de receita.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleWhatsAppClick} // Updated to WhatsApp link
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Quero aumentar minhas vendas
            </button>
            <button
              onClick={handleWhatsAppClick} // Updated to WhatsApp link
              className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Falar com um especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}