import { Target, TrendingUp, Zap } from 'lucide-react';

export default function NossaFilosofia() {
  return (
    <section id="nossa-filosofia" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Nossa Filosofia
            </span>
          </h2>
          <p className="text-2xl font-bold text-white max-w-3xl mx-auto">
            Resultados de verdade, não promessas.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Text Content */}
          <div className="space-y-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              A maioria das agências foca em métricas de vaidade: curtidas, impressões e seguidores.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Na P4D Mídia, nossas conversas diárias são sobre <span className="text-green-400 font-bold">lucro, faturamento e resultados reais.</span>
            </p>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
              <p className="text-xl text-gray-200 font-medium">
                Acreditamos que aumento de vendas <span className="text-blue-400 font-bold">não é mágica — é processo.</span><br />
                E nós dominamos esse processo de ponta a ponta.
              </p>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              Cada campanha, funil e sistema que criamos é uma engrenagem conectada para gerar <span className="text-purple-400 font-bold">crescimento acelerado em até 90 dias.</span>
            </p>
          </div>

          {/* Visual Elements */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Outras Agências</h3>
              </div>
              <p className="text-gray-400">
                Curtidas • Impressões • Seguidores • Métricas de vaidade
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-green-500/50 rounded-xl p-6 transform scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">P4D Mídia</h3>
              </div>
              <p className="text-green-400 font-semibold">
                Lucro • Faturamento • ROI • Receita Real • Crescimento
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Crescimento em 90 dias</h4>
              <p className="text-blue-300">Resultados acelerados e sustentáveis</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
