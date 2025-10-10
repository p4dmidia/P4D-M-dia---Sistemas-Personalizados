"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, Globe, Bell, Palette, Info } from 'lucide-react';

export default function AdminSettingsPage() {
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
          Configurações do Sistema
        </h2>

        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700 text-center">
          <Settings className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <p className="text-2xl font-semibold text-white mb-4">
            Esta seção está em desenvolvimento!
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Aqui você poderá gerenciar configurações globais do P4D Studio, como integrações, notificações e personalização de marca.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Configurações Gerais</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Bell className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Notificações</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Palette className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Personalização</p>
              <p className="text-gray-400">Em breve</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <Info className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Integrações</p>
              <p className="text-gray-400">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}