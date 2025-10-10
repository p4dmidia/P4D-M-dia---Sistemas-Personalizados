"use client";

import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Info, DollarSign, FileText, Code, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/browserClient';
import { Project } from '@/shared/types';

interface UserProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const projectStatusMap: { [key: string]: { text: string; icon: JSX.Element } } = {
  briefing_received: { text: 'Briefing Recebido', icon: <FileText className="w-4 h-4 text-blue-400" /> },
  development_started: { text: 'Desenvolvimento Iniciado', icon: <Code className="w-4 h-4 text-purple-400" /> },
  internal_review: { text: 'Revisão Interna', icon: <Search className="w-4 h-4 text-yellow-400" /> },
  final_delivery: { text: 'Entrega Final', icon: <Check className="w-4 h-4 text-green-400" /> },
};

export default function UserProjectsModal({ isOpen, onClose, userId, userName }: UserProjectsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProjects([]);
      return;
    }

    const fetchUserProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.access_token) {
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          onClose();
          return;
        }

        const response = await fetch(`/api/projects?userId=${userId}`, { // Assuming API can filter by userId
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar projetos do usuário.');
        }

        const data: Project[] = await response.json();
        setProjects(data);
      } catch (err: any) {
        console.error('Erro ao buscar projetos do usuário:', err);
        setError(err.message || 'Erro ao carregar projetos.');
        toast.error(err.message || 'Erro ao carregar projetos.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [isOpen, userId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-3xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
          <FolderOpen className="w-7 h-7 text-blue-400" /> Projetos de {userName}
        </h3>

        {loading ? (
          <p className="text-center text-gray-400 text-lg py-10">Carregando projetos...</p>
        ) : error ? (
          <p className="text-center text-red-400 text-lg py-10">Erro: {error}</p>
        ) : projects.length === 0 ? (
          <p className="text-center text-gray-400 text-lg py-10">Nenhum projeto encontrado para este usuário.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plano
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Criado Em
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entrega Estimada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {project.plan_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'final_delivery' ? 'bg-green-800/30 text-green-400' :
                        project.status === 'development_started' ? 'bg-purple-800/30 text-purple-400' :
                        'bg-blue-800/30 text-blue-400'
                      }`}>
                        {projectStatusMap[project.status]?.icon}
                        {projectStatusMap[project.status]?.text || project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {new Date(project.created_at!).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {project.estimated_delivery || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}