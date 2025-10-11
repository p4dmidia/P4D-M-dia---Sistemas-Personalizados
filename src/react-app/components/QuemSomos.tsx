import { TrendingUp, Target, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function QuemSomos() {
  const navigate = useNavigate(); // Initialize useNavigate

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartFunnel = () => {
    navigate('/funnel'); // Navigate to the funnel page
  };

  return (
    <section id="quem-somos" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Somos a P4D Mídia
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tecnologia e marketing trabalhando juntos para gerar resultados reais
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Text Content */}
          <div className="space-y-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              A <span className="text-blue-400 font-semibold">P4D Mídia</span> é uma agência de marketing digital e tecnologia especializada em criar sistemas inteligentes, estratégias de vendas e soluções personalizadas que impulsionam negócios para o futuro.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Combinamos tecnologia de ponta, design moderno e inteligência de marketing para transformar ideias em plataformas funcionais e lucrativas. Nossa missão é simplificar o digital e entregar resultados reais, com agilidade, inovação e acessibilidade.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Somos movidos por performance, mas guiados por propósito — e é por isso que fazemos parte do <span className="text-purple-400 font-semibold">Grupo Empire (<a href="https://www.grupoempireonline.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">www.grupoempireonline.com</a>)</span>, um ecossistema global que conecta mídia, tecnologia, moda, saúde e benefícios em um só lugar.
            </p>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <p className="text-lg text-gray-200 font-medium">
                Essa parceria nos coloca lado a lado com marcas e projetos de impacto nacional e internacional, permitindo à P4D oferecer muito mais do que marketing: entregamos plataformas completas, visibilidade e crescimento em escala.
              </p>
              <p className="text-lg text-gray-200 font-medium mt-4">
                Juntos, P4D Mídia e Grupo Empire estão construindo um novo modelo de negócios — onde a inovação encontra a performance e o resultado é simples: crescimento real, sustentável e em escala global. 🚀
              </p>
            </div>
            <button
              onClick={handleStartFunnel} // Connect to funnel
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Conheça a P4D Mídia
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                +300%
              </div>
              <div className="text-gray-400 text-sm">Aumento Médio de Vendas</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-gray-400 text-sm">Projetos Entregues</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:border-green-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                98%
              </div>
              <div className="text-gray-400 text-sm">Clientes Satisfeitos</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:border-orange-500/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                5+
              </div>
              <div className="text-gray-400 text-sm">Anos de Experiência</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}