import { ShoppingCart, Users, CreditCard, Cog } from 'lucide-react';

export default function ComoFunciona() {
  const steps = [
    {
      icon: <Cog className="w-8 h-8" />,
      title: 'Escolha o plano ideal',
      description: 'Selecione o plano que melhor se adequa ao seu negócio e necessidades.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Descreva seu projeto',
      description: 'Conte como quer o seu sistema e quais funcionalidades precisa.'
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: 'Aguarde o desenvolvimento',
      description: 'Nossa equipe desenvolve seu sistema em 2 a 7 dias úteis.'
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: 'Receba pronto e funcionando',
      description: 'Seu sistema será entregue pronto, hospedado e funcionando perfeitamente.'
    }
  ];

  

  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Aluguel de Sistemas Personalizados
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tenha o sistema ideal para o seu negócio, sem pagar caro por desenvolvimento.<br />
            Você descreve, a P4D desenvolve, hospeda, cuida e entrega o sistema pronto para uso.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform translate-x-4 z-0" />
              )}
              
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center group hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Simplified Delivery Time */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Tempo de Entrega
            </span>
          </h3>
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="text-3xl font-bold text-blue-400 mb-3">2 a 7 dias úteis</div>
            <p className="text-gray-400">Seu sistema personalizado entregue rapidamente, pronto para uso.</p>
          </div>
        </div>

        {/* Guarantee */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="text-2xl mb-3">💬</div>
            <h4 className="text-xl font-bold text-white mb-2">Garantia Incondicional</h4>
            <p className="text-purple-300">15 dias após a assinatura</p>
          </div>
        </div>
      </div>
    </section>
  );
}