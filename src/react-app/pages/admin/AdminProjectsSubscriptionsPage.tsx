"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, FileText, DollarSign, Code, Search, Check, Info, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Project, Subscription } from '@/shared/types';
import { supabase } from '@/integrations/supabase/browserClient';
import EditProjectModal from '@/react-app/components/admin/EditProjectModal'; // Importar o novo modal

export default function AdminProjectsSubscriptionsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      // Fetch Projects
      const projectsResponse = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!projectsResponse.ok) {
        const errorData = await projectsResponse.json();
        throw new Error(errorData.error || 'Falha ao buscar projetos.');
      }
      const projectsData: Project[] = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch Subscriptions
      const subscriptionsResponse = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!subscriptionsResponse.ok) {
        const errorData = await subscriptionsResponse.json();
        throw new Error(errorData.error || 'Falha ao buscar assinaturas.');
      }
      const subscriptionsData: Subscription[] = await subscriptionsResponse.json();
      setSubscriptions(subscriptionsData);

    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao carregar projetos e assinaturas.');
      toast.error(err.message || 'Erro ao carregar projetos e assinaturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectModalOpen(true);
  };

  const handleSaveProject = async (
    projectId: string,
    data: { status: string; summary?: string; estimated_delivery?: string }
  ) => {
    toast.loading('Salvando alterações do projeto...', { id: 'saveProject' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'saveProject' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar projeto.');
      }

      toast.success('Projeto salvo com sucesso!', { id: 'saveProject' });
      fetchData(); // Re-fetch data to update the list
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err);
      toast.error(err.message || 'Erro ao salvar projeto.', { id: 'saveProject' });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este projeto? Esta ação é irreversível.')) {
      return;
    }

    toast.loading('Deletando projeto...', { id: 'deleteProject' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'deleteProject' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar projeto.');
      }

      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      toast.success('Projeto deletado com sucesso!', { id: 'deleteProject' });
    } catch (err: any) {
      console.error('Erro ao deletar projeto:', err);
      toast.error(err.message || 'Erro ao deletar projeto.', { id: 'deleteProject' });
    }
  };

  const handleEditSubscription = (subscriptionId: string) => {
    toast.info(`Editar assinatura ${subscriptionId} (funcionalidade em breve!)`);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta assinatura? Esta ação é irreversível.')) {
      return;
    }

    toast.loading('Deletando assinatura...', { id: 'deleteSubscription' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'deleteSubscription' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar assinatura.');
      }

      setSubscriptions(prevSubscriptions => prevSubscriptions.filter(sub => sub.id !== subscriptionId));
      toast.success('Assinatura deletada com sucesso!', { id: 'deleteSubscription' });
    } catch (err: any) {
      console.error('Erro ao deletar assinatura:', err);
      toast.error(err.message || 'Erro ao deletar assinatura.', { id: 'deleteSubscription' });
    }
  };

  const getProjectStatusText = (status: string | undefined) => {
    switch (status) {
      case 'briefing_received': return 'Briefing Recebido';
      case 'development_started': return 'Desenvolvimento Iniciado';
      case 'internal_review': return 'Revisão Interna';
      case 'final_delivery': return 'Entrega Final';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando projetos e assinaturas...</p>
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
          Gerenciar Projetos e Assinaturas
        </h2>

        {/* Seção de Projetos */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700 mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" /> Projetos
          </h3>
          {projects.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">Nenhum projeto encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID do Projeto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID do Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Criado Em
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{project.id?.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{project.user_id?.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{project.plan_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'final_delivery' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getProjectStatusText(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(project.created_at!).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                          title="Editar Projeto"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id!)}
                          className="text-red-400 hover:text-red-300"
                          title="Deletar Projeto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção de Assinaturas */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-purple-400" /> Assinaturas
          </h3>
          {subscriptions.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">Nenhuma assinatura encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID da Assinatura
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID do Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Próximo Vencimento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sub.id?.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sub.user_id?.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sub.plan_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">R$ {sub.amount.toFixed(2).replace('.', ',')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' : sub.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {sub.next_due_date ? new Date(sub.next_due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditSubscription(sub.id!)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                          title="Editar Assinatura"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(sub.id!)}
                          className="text-red-400 hover:text-red-300"
                          title="Deletar Assinatura"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingProject && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setIsEditProjectModalOpen(false)}
          project={editingProject}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}