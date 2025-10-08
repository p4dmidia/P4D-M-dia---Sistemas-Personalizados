import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

export default function Depoimentos() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: 'Carlos Mendoza',
      company: 'E-commerce Fashion',
      role: 'CEO',
      content: 'Com a P4D Mídia, aumentamos nossas vendas em 300% em apenas 6 meses. O sistema de e-commerce é perfeito!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Ana Silva',
      company: 'Marketing Digital Pro',
      role: 'Diretora de Marketing',
      content: 'O sistema de afiliados revolucionou nossa operação. Agora gerenciamos mais de 1000 afiliados com facilidade.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Roberto Santos',
      company: 'Tech Solutions',
      role: 'Fundador',
      content: 'O suporte da P4D é excepcional. Sempre que precisamos, eles estão lá. Nossa plataforma SaaS nunca funcionou tão bem.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Mariana Costa',
      company: 'Clube Premium',
      role: 'Gerente Geral',
      content: 'Nosso clube de assinatura cresceu 250% após implementar o sistema da P4D. A automação é impressionante!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Pedro Oliveira',
      company: 'StartupTech',
      role: 'CTO',
      content: 'A velocidade de implementação me surpreendeu. Em 2 semanas já estávamos no ar com tudo funcionando perfeitamente.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="depoimentos" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              O que nossos clientes dizem
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Resultados reais de empresas que transformaram seus negócios
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
            {/* Quote Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Quote className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed mb-6 italic">
                "{testimonials[currentIndex].content}"
              </p>

              {/* Rating */}
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: testimonials[currentIndex].rating }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].name}
                  className="w-16 h-16 rounded-full border-2 border-blue-400"
                />
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-white">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-blue-400 font-medium">
                    {testimonials[currentIndex].role}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              4.9/5
            </div>
            <div className="text-gray-400">Avaliação Média</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              +200
            </div>
            <div className="text-gray-400">Clientes Satisfeitos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              98%
            </div>
            <div className="text-gray-400">Taxa de Retenção</div>
          </div>
        </div>
      </div>
    </section>
  );
}
