import { useEffect } from 'react';
import Header from '@/react-app/components/Header';
import HeroSection from '@/react-app/components/HeroSection';
import QuemSomos from '@/react-app/components/QuemSomos';
import ComoFunciona from '@/react-app/components/ComoFunciona';
import Planos from '@/react-app/components/Planos';
import AssessoriaMarketing from '@/react-app/components/AssessoriaMarketing';
import NossaFilosofia from '@/react-app/components/NossaFilosofia';
import ExpertiseCompromisso from '@/react-app/components/ExpertiseCompromisso';
import Vantagens from '@/react-app/components/Vantagens';
import Depoimentos from '@/react-app/components/Depoimentos';
import CTAFinal from '@/react-app/components/CTAFinal';
import Contato from '@/react-app/components/Contato';
import Footer from '@/react-app/components/Footer';
import WhatsAppButton from '@/react-app/components/WhatsAppButton';

export default function Home() {
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header />
      <main>
        <HeroSection />
        <QuemSomos />
        <ComoFunciona />
        <Planos />
        <AssessoriaMarketing />
        <NossaFilosofia />
        <ExpertiseCompromisso />
        <Vantagens />
        <Depoimentos />
        <CTAFinal />
        <Contato />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}