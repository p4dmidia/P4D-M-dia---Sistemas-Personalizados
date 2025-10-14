"use client";

import { useEffect, useState } from 'react'; // Removido importação explícita de React
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, BarChart2, TrendingUp, Users, DollarSign, Info, CheckCircle2, Hourglass, Code, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient';

interface AnalyticsSummary {
  totalUsers: number;
  totalProjects: number;
  activeSubscriptions: number;
  projectsByStatus: { status: string; count: number }[];
}

export default function AdminReportsAnalyticsPage() {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.access_token) {
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          navigate('/login');
          return;
        }

        const response = await fetch('/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar dados de análise.');
        }

        const data: AnalyticsSummary = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Erro ao buscar dados de análise:', err);
        setError(err.message || 'Erro ao carregar relatórios e análises.');
        toast.error(err.message || 'Erro ao carregar relatórios e análises.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'briefing_received': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'development_started': return <Code className="w-5 h-5 text-purple-400" />;
      case 'internal_review': return <Hourglass className="w-5 h-5 text-yellow-400" />;
      case 'final_delivery': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'briefing_received': return 'Briefing Recebido';
      case 'development_started': return 'Desenvolvimento Iniciado';
      case 'internal_review': return 'Revisão Interna';
      case 'final_delivery': return 'Entrega Final';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando relatórios e análises...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
        <p className="text-xl text-red-500 mb-4">Erro: {error}</p>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar ao Painel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar ao Painel
        </button>

        <h2 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Relatórios e Análises
        </h2>

        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
              <Users className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-white">Usuários Totais</p>
              <p className="text-gray-300 text-3xl font-extrabold">{analyticsData?.totalUsers ?? 0}</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
              <TrendingUp className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-white">Projetos Totais</p>
              <p className="text-gray-300 text-3xl font-extrabold">{analyticsData?.totalProjects ?? 0}</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
              <DollarSign className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-white">Assinaturas Ativas</p>
              <p className="text-gray-300 text-3xl font-extrabold">{analyticsData?.activeSubscriptions ?? 0}</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
              <BarChart2 className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-white">Métricas Personalizadas</p>
              <p className="text-gray-300 text-xl">Em breve</p>
            </div>
          </div>

          {/* Projetos por Status */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Info className="w-6 h-6 text-cyan-400" /> Projetos por Status
            </h3>
            {analyticsData?.projectsByStatus && analyticsData.projectsByStatus.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.projectsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <span className="text-lg text-gray-300">{getStatusText(item.status)}</span>
                    </div>
                    <span className="text-xl font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-lg">Nenhum projeto com status encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}