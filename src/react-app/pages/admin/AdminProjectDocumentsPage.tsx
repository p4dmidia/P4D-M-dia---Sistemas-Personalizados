"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, FileText, PlusCircle, Edit, Trash2, Search, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient';
import { InternalDocument, Project } from '@/shared/types';

interface CreateEditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: Partial<InternalDocument>) => Promise<void>;
  documentToEdit?: InternalDocument | null;
  projects: Project[];
}

const documentTypes = ['PRD', 'Copy', 'AI_Prompt', 'Other'];

function CreateEditDocumentModal({ isOpen, onClose, onSave, documentToEdit, projects }: CreateEditDocumentModalProps) {
  const [documentType, setDocumentType] = useState(documentToEdit?.document_type || documentTypes[0]);
  const [projectId, setProjectId] = useState(documentToEdit?.project_id || '');
  const [content, setContent] = useState(documentToEdit?.content || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentToEdit) {
      setDocumentType(documentToEdit.document_type);
      setProjectId(documentToEdit.project_id);
      setContent(documentToEdit.content);
    } else if (isOpen) {
      // Reset form for new document
      setDocumentType(documentTypes[0]);
      setProjectId(projects.length > 0 ? projects[0].id! : '');
      setContent('');
    }
  }, [isOpen, documentToEdit, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: documentToEdit?.id,
        document_type: documentType,
        project_id: projectId,
        content,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          {documentToEdit ? 'Editar Documento' : 'Criar Novo Documento'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Documento
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-300 mb-2">
              Projeto Associado
            </label>
            <select
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.plan_name} (ID: {project.id?.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Conteúdo
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Insira o conteúdo do documento aqui..."
              required
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
              {loading ? 'Salvando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function AdminProjectDocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<InternalDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const fetchDocumentsAndProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      // Fetch Projects (needed for dropdown in modal)
      const projectsResponse = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!projectsResponse.ok) {
        const errorData = await projectsResponse.json();
        throw new Error(errorData.error || 'Falha ao buscar projetos.');
      }
      const projectsData: Project[] = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch Internal Documents
      const documentsResponse = await fetch('/api/internal-documents', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!documentsResponse.ok) {
        const errorData = await documentsResponse.json();
        throw new Error(errorData.error || 'Falha ao buscar documentos internos.');
      }
      const documentsData: InternalDocument[] = await documentsResponse.json();
      setDocuments(documentsData);

    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao carregar documentos e projetos.');
      toast.error(err.message || 'Erro ao carregar documentos e projetos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsAndProjects();
  }, [navigate]);

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const handleEditDocument = (document: InternalDocument) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleSaveDocument = async (document: Partial<InternalDocument>) => {
    toast.loading('Salvando documento...', { id: 'saveDocument' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'saveDocument' });
        navigate('/login');
        return;
      }

      const method = document.id ? 'PUT' : 'POST';
      const url = document.id ? `/api/internal-documents/${document.id}` : '/api/internal-documents';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(document),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar documento.');
      }

      toast.success('Documento salvo com sucesso!', { id: 'saveDocument' });
      fetchDocumentsAndProjects(); // Re-fetch to update list
    } catch (err: any) {
      console.error('Erro ao salvar documento:', err);
      toast.error(err.message || 'Erro ao salvar documento.', { id: 'saveDocument' });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este documento? Esta ação é irreversível.')) {
      return;
    }

    toast.loading('Deletando documento...', { id: 'deleteDocument' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'deleteDocument' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/internal-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar documento.');
      }

      toast.success('Documento deletado com sucesso!', { id: 'deleteDocument' });
      fetchDocumentsAndProjects(); // Re-fetch to update list
    } catch (err: any) {
      console.error('Erro ao deletar documento:', err);
      toast.error(err.message || 'Erro ao deletar documento.', { id: 'deleteDocument' });
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.plan_name : 'N/A';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
                          doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getProjectName(doc.project_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando documentos do projeto...</p>
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

        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Gerenciar Documentos do Projeto
          </h2>
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            Novo Documento
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por conteúdo, tipo ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todos os Tipos</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
          {filteredDocuments.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">Nenhum documento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Projeto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Conteúdo (Trecho)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.document_type === 'PRD' ? 'bg-blue-100 text-blue-800' :
                          doc.document_type === 'Copy' ? 'bg-purple-100 text-purple-800' :
                          doc.document_type === 'AI_Prompt' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-gray-500" /> {getProjectName(doc.project_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {doc.content.substring(0, 100)}{doc.content.length > 100 ? '...' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(doc.updated_at!).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditDocument(doc)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                          title="Editar Documento"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id!)}
                          className="text-red-400 hover:text-red-300"
                          title="Deletar Documento"
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

      <CreateEditDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDocument}
        documentToEdit={editingDocument}
        projects={projects}
      />
    </div>
  );
}