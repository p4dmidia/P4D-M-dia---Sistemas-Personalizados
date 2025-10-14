"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Code, Search, Check, ChevronDown } from 'lucide-react'; // Adicionado ChevronDown
import { Project } from '@/shared/types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, data: { status: string; summary?: string | null; estimated_delivery?: string | null }) => Promise<void>; // Ajustado para aceitar null
}

const projectStatusOptions = [
  { value: 'briefing_received', label: 'Briefing Recebido', icon: <FileText className="w-5 h-5" /> },
  { value: 'development_started', label: 'Desenvolvimento Iniciado', icon: <Code className="w-5 h-5" /> },
  { value: 'internal_review', label: 'Revisão Interna', icon: <Search className="w-5 h-5" /> },
  { value: 'final_delivery', label: 'Entrega Final', icon: <Check className="w-5 h-5" /> },
];

export default function EditProjectModal({ isOpen, onClose, project, onSave }: EditProjectModalProps) {
  const [status, setStatus] = useState(project?.status || 'briefing_received');
  const [summary, setSummary] = useState(project?.summary || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(project?.estimated_delivery || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setStatus(project.status);
      setSummary(project.summary || '');
      setEstimatedDelivery(project.estimated_delivery || '');
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    setLoading(true);
    try {
      await onSave(project.id, {
        status,
        summary: summary || null, // Envia null se estiver vazio
        estimated_delivery: estimatedDelivery || null, // Envia null se estiver vazio
      });
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
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Editar Projeto: {project?.plan_name}</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-300 mb-2">
              Status do Projeto
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <ChevronDown className="w-5 h-5" />
              </div>
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
              placeholder="Adicione um resumo do andamento do projeto para o cliente..."
            />
          </div>

          <div>
            <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-300 mb-2">
              Entrega Estimada (opcional)
            </label>
            <input
              type="text"
              id="estimatedDelivery"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 15/10/2024 ou 'Em breve'"
            />
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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}