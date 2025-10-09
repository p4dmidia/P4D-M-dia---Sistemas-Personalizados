import { useState, useEffect } from 'react';
import { Menu, X, LogIn } from 'lucide-react'; // Importar LogIn icon
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const handleStartFunnel = () => {
    navigate('/funnel');
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login'); // Navega para a página de login
    setIsMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/90 backdrop-blur-lg border-b border-purple-500/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              P4D Mídia
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-8">
            {[
              { name: 'Início', id: 'inicio' },
              { name: 'Quem Somos', id: 'quem-somos' },
              { name: 'Sistemas', id: 'como-funciona' },
              { name: 'Planos', id: 'planos' },
              { name: 'Marketing', id: 'assessoria-marketing' },
              { name: 'Contato', id: 'contato' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* CTA Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4"> {/* Adicionado flex e space-x-4 */}
            <button
              onClick={handleLogin}
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium flex items-center gap-1"
            >
              <LogIn className="w-5 h-5" />
              Login
            </button>
            <button
              onClick={handleStartFunnel}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              Solicitar Demonstração
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-purple-500/20 mt-4 rounded-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {[
                { name: 'Início', id: 'inicio' },
                { name: 'Quem Somos', id: 'quem-somos' },
                { name: 'Sistemas', id: 'como-funciona' },
                { name: 'Planos', id: 'planos' },
                { name: 'Marketing', id: 'assessoria-marketing' },
                { name: 'Contato', id: 'contato' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-3 py-2 text-gray-300 hover:text-blue-400 transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={handleLogin}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>
              <button
                onClick={handleStartFunnel}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-full"
              >
                Solicitar Demonstração
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}