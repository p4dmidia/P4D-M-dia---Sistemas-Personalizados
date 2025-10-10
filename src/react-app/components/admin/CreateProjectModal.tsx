"use client";

import React, { useState } from 'react';
import { X, Save, FileText, User, DollarSign, Calendar } from 'lucide-react';
import { Project } from '@/shared/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  users: { id: string; email: string; first_name: string | null; last_name: string | null }[];
}

const projectStatusOptions = [
  { value: 'briefing_received', label: 'Briefing Recebido' },
  { value: 'development_started', label: 'Desenvolvimento Iniciado' },
  { value: 'internal_review', label: 'Revisão Interna' },
  { value: 'final_delivery', label: 'Entrega Final' },
];

export default function CreateProjectModal({ isOpen, onClose, onCreate, users }: CreateProjectModalProps) {
  const [userId, setUserId] = useState('');
  const [funnelResponseId, setFunnelResponseId] = useState('');
  const [planName, setPlanName] = useState('');
  const [status, setStatus] = useState('briefing_received');
  const [summary, setSummary] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({
        user_id: userId,
        funnel_response_id: funnelResponseId || undefined, // Optional
        plan_name: planName,
        status,
        summary: summary || null,
        estimated_delivery: estimatedDelivery || null,
      });
      // Reset form
      setUserId('');
      setFunnelResponseId('');
      setPlanName('');
      setStatus('briefing_received');
      setSummary('');
      setEstimatedDelivery('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Criar Novo Projeto</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-2">
              Usuário (Cliente) *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Plano *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: E-commerce de Alta Conversão"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-300 mb-2">
              Status do Projeto *
            </label>
            <div className="relative">
              <select
                id="projectStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {projectStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="projectSummary" className="block text-sm font-medium text-gray-300 mb-2">
              Resumo (opcional)
            </label>
            <textarea
              id="projectSummary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Adicione um resumo do projeto..."
            />
          </div>

          <div>
            <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-300 mb-2">
              Entrega Estimada (opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="estimatedDelivery"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 15/10/2025 ou 'Em breve'"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}