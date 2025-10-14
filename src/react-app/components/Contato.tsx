import { MessageCircle, Mail, MapPin, Instagram, Linkedin, Youtube } from 'lucide-react'; // Adicionado Instagram, Linkedin, Youtube

export default function Contato() {
  const handleWhatsAppClick = () => {
    window.open('https://w.app/k5ws4g', '_blank'); // Usando o link direto fornecido
  };

  return (
    <section id="contato" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Entre em Contato
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Pronto para revolucionar seu negócio? Fale conosco agora!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* WhatsApp CTA */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center flex flex-col justify-center items-center">
            <MessageCircle className="w-16 h-16 text-green-400 mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Fale com um Especialista no WhatsApp
            </h3>
            <p className="text-lg text-gray-300 mb-8 max-w-md">
              Tire suas dúvidas, solicite uma demonstração ou comece seu projeto agora mesmo.
              Nosso time está pronto para te atender!
            </p>
            <button
              onClick={handleWhatsAppClick}
              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              Iniciar Conversa no WhatsApp
            </button>
          </div>

          {/* Contact Info (mantido do original) */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Outras formas de contato</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">WhatsApp</h4>
                    <p className="text-gray-400">(31) 99607-0786</p>
                    <p className="text-gray-400">(34) 99675-6400</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Email</h4>
                    <p className="text-gray-400">contato@p4dmidia.com.br</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Localização</h4>
                    <p className="text-gray-400">São Paulo, SP - Brasil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Siga-nos nas redes</h3>
              
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                >
                  <Youtube className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Por que escolher a P4D?</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tempo de resposta</span>
                  <span className="text-blue-400 font-semibold">Até 2 horas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Projetos ativos</span>
                  <span className="text-purple-400 font-semibold">+100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Anos de experiência</span>
                  <span className="text-green-400 font-semibold">+3 anos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Taxa de sucesso</span>
                  <span className="text-yellow-400 font-semibold">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}