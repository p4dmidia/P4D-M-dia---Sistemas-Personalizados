import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function CTAFinal() {
  const navigate = useNavigate(); // Initialize useNavigate

  // Removed scrollToSection as it's no longer needed for these buttons

  const handleWhatsAppClick = () => {
    window.open('https://w.app/k5ws4g', '_blank'); // Direct WhatsApp link
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-blue-500/10" />
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-500" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-700" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Sparkles Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-8 animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Tem uma ideia? Um projeto personalizado?
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Ou quer crescer de verdade?
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Na P4D Mídia, criamos sistemas inteligentes e campanhas poderosas para gerar resultado real.<br />
          Vamos construir juntos a próxima fase de crescimento da sua empresa.
        </p>

        {/* Main CTA */}
        <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleWhatsAppClick} // Updated to WhatsApp link
            className="group bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:from-purple-600 hover:via-blue-600 hover:to-cyan-600 text-white font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3 mx-auto"
          >
            Solicitar meu sistema agora
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={handleWhatsAppClick} // Updated to WhatsApp link
            className="group border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            Falar com especialista em marketing
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Secondary Info */}
        <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                ⚡ Setup Rápido
              </div>
              <p className="text-gray-400">Seu sistema pronto em poucos dias</p>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                🛡️ Sem Riscos
              </div>
              <p className="text-gray-400">Garantia de 15 dias</p>
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                🚀 Suporte Total
              </div>
              <p className="text-gray-400">Equipe especializada 24/7</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>+500 projetos entregues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></div>
            <span>98% de satisfação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-600"></div>
            <span>Suporte 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}