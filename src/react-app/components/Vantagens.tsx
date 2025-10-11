import { Rocket, Target, DollarSign, Headphones, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function Vantagens() {
  const navigate = useNavigate(); // Initialize useNavigate

  const advantages = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Sistemas e Estratégias Prontos para Lucro',
      description: 'Entregamos sistemas e estratégias prontos para gerar lucro.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Sem Taxa de Desenvolvimento',
      description: 'Não cobramos taxa de desenvolvimento.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: 'Hospedagem e Suporte Inclusos',
      description: 'Hospedagem e suporte inclusos.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Acompanhamento Humano',
      description: 'Acompanhamento humano e consultivo.',
      color: 'from-orange-400 to-red-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Design Moderno e Performance',
      description: 'Design moderno e alta performance.',
      color: 'from-indigo-400 to-purple-500'
    }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWhatsAppClick = () => {
    window.open('https://w.app/k5ws4g', '_blank'); // Direct WhatsApp link
  };

  return (
    <section id="vantagens" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Por que escolher a P4D Mídia?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Resultados que pagam as contas — não apenas números de vaidade
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          {advantages.map((advantage, index) => (
            <div 
              key={index} 
              className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/70 transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-br hover:from-gray-700/40 hover:to-gray-800/40"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${advantage.color} rounded-xl text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {advantage.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                {advantage.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Pronto para revolucionar seu negócio?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Fale com um de nossos consultores e descubra como podemos transformar sua empresa
          </p>
          <button
            onClick={handleWhatsAppClick} // Updated to WhatsApp link
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
          >
            Fale com um Consultor Agora
          </button>
        </div>
      </div>
    </section>
  );
}