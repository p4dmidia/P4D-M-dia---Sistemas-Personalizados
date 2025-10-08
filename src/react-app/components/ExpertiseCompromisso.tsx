import { Users, Target, TrendingUp, Heart } from 'lucide-react';

export default function ExpertiseCompromisso() {
  const expertise = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Expertise Especializada',
      description: 'Equipe com experiência em marketing digital e desenvolvimento web, sempre atualizada com as últimas tendências.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Abordagem Personalizada',
      description: 'Cada negócio é único. Criamos estratégias sob medida, ajustadas ao seu público e à sua realidade.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Foco nos Resultados',
      description: 'Métricas precisas e análise contínua garantem um ROI real e mensurável.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Compromisso com o Seu Negócio',
      description: 'Entendemos seus desafios, nos tornamos parte da sua operação e trabalhamos como extensão do seu time.',
      color: 'from-orange-400 to-red-500'
    }
  ];

  return (
    <section id="expertise-compromisso" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Expertise e Compromisso
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            O que nos diferencia no mercado e garante seus resultados
          </p>
        </div>

        {/* Expertise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {expertise.map((item, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600/70 transition-all duration-300 transform hover:scale-105"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${item.color} rounded-xl text-white mb-6 shadow-lg`}>
                {item.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-semibold text-white mb-4">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Summary Statement */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Mais que uma agência, somos seu parceiro de crescimento
          </h3>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Trabalhamos lado a lado com você para transformar desafios em oportunidades e objetivos em resultados concretos. Seu sucesso é nosso sucesso.
          </p>
        </div>
      </div>
    </section>
  );
}
