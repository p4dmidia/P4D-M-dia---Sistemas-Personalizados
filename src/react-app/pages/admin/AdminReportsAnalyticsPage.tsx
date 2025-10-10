"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart2, TrendingUp, Users, DollarSign, Info } from 'lucide-react';

export default function AdminReportsAnalyticsPage() {
  const navigate = useNavigate();

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

        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700 text-center">
          <BarChart2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <p className="text-2xl font-semibold text-white mb-4">
            Esta seção está em desenvolvimento!
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Em breve, você terá acesso a relatórios detalhados sobre usuários, projetos, vendas e desempenho geral do sistema.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Usuários Ativos</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Projetos Concluídos</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Receita Mensal</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Info className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Métricas Personalizadas</p>
              <p className="text-gray-400">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}