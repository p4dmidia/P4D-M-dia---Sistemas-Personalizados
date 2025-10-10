"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, User, Mail, Calendar, Edit, Trash2, UserPlus, Ban, CheckCircle2, Search, Filter, Eye, ToggleLeft, ToggleRight, Hourglass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient'; // Importar o cliente Supabase
import EditUserModal from '@/react-app/components/admin/EditUserModal';
import CreateUserModal from '@/react-app/components/admin/CreateUserModal';
import UserProjectsModal from '@/react-app/components/admin/UserProjectsModal'; // Importar o novo modal
import { UserSchema, Project } from '@/shared/types'; // Importar UserSchema para os tipos de role e Project
import { z } from 'zod'; // Importar z do zod

type UserRole = z.infer<typeof UserSchema.shape.role>; // Definir UserRole a partir do schema

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole; // Usar o tipo UserRole
  updated_at: string;
  asaas_customer_id: string | null;
  auth_users: {
    email: string;
    created_at: string;
    banned_until: string | null;
    email_confirmed_at: string | null; // Adicionado
  };
}

export default function AdminUsersPage() {
  console.log('AdminUsersPage rendering...'); // Log para depuração
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]); // Sempre inicializado como array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false); // Novo estado para o modal de projetos
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<{ id: string; name: string } | null>(null); // Novo estado para o usuário selecionado para projetos
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'All'>('All');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }
      setCurrentAdminId(session.user.id);

      const response = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorDetails = 'Falha ao buscar usuários.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorDetails = response.statusText || 'Erro desconhecido ao buscar usuários.';
        }
        throw new Error(errorDetails);
      }

      const data: UserProfile[] = await response.json();
      if (!Array.isArray(data)) {
        console.error('API response for profiles is not an array:', data);
        throw new Error('Dados de usuários inválidos recebidos do servidor. Esperado um array, mas recebeu: ' + JSON.stringify(data));
      }
      setUsers(data);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message || 'Erro ao carregar usuários.');
      toast.error(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleEditUser = (user: UserProfile) => {
    setEditingUser({
      ...user,
      email: user.auth_users.email,
      is_banned: !!user.auth_users.banned_until,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (
    userId: string,
    data: { first_name?: string; last_name?: string; email?: string; role?: UserRole; is_banned?: boolean }
  ) => {
    toast.loading('Salvando alterações...', { id: 'saveUser' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'saveUser' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/profiles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetails = 'Falha ao salvar usuário.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorDetails = response.statusText || 'Erro desconhecido ao salvar usuário.';
        }
        throw new Error(errorDetails);
      }

      toast.success('Usuário salvo com sucesso!', { id: 'saveUser' });
      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      toast.error(err.message || 'Erro ao salvar usuário.', { id: 'saveUser' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
      toast.error('Você não pode deletar sua própria conta.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação é irreversível.')) {
      return;
    }

    toast.loading('Deletando usuário...', { id: 'deleteUser' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'deleteUser' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/profiles/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorDetails = 'Falha ao deletar usuário.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorDetails = response.statusText || 'Erro desconhecido ao deletar usuário.';
        }
        throw new Error(errorDetails);
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      toast.success('Usuário deletado com sucesso!', { id: 'deleteUser' });
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      toast.error(err.message || 'Erro ao deletar usuário.', { id: 'deleteUser' });
    }
  };

  const handleCreateUser = async (
    data: { first_name: string; last_name: string; email: string; password: string; role: UserRole; send_credentials_email: boolean }
  ) => {
    toast.loading('Cadastrando novo usuário...', { id: 'createUser' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'createUser' });
        navigate('/login');
        return;
      }

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        }),
      });

      if (!response.ok) {
        let errorDetails = 'Falha ao cadastrar usuário.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || JSON.stringify(errorData);
        } catch (jsonError) {
          errorDetails = response.statusText || 'Erro desconhecido ao cadastrar usuário.';
        }
        throw new Error(errorDetails);
      }

      toast.success('Usuário cadastrado com sucesso!', { id: 'createUser' });
      
      if (data.send_credentials_email) {
        await handleResendAccess(data.email); // Reutiliza a função para enviar link de redefinição
      }

      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      console.error('Erro ao cadastrar usuário:', err);
      toast.error(err.message || 'Erro ao cadastrar usuário.', { id: 'createUser' });
    }
  };

  const handleResendAccess = async (email: string) => {
    toast.loading('Reenviando link de acesso...', { id: 'resendAccess' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`, // Redireciona para a página de login após redefinição
      });

      if (error) {
        console.error('Erro ao reenviar acesso:', error);
        toast.error(error.message || 'Falha ao reenviar link de acesso.', { id: 'resendAccess' });
      } else {
        toast.success('Link de redefinição de senha enviado para o email!', { id: 'resendAccess' });
      }
    } catch (err: any) {
      console.error('Erro inesperado ao reenviar acesso:', err);
      toast.error('Erro inesperado ao reenviar link de acesso.', { id: 'resendAccess' });
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    if (user.id === currentAdminId) {
      toast.error('Você não pode alterar o status da sua própria conta.');
      return;
    }

    const newBannedStatus = !user.auth_users.banned_until; // Toggle ban status
    const actionText = newBannedStatus ? 'inativar' : 'ativar';

    if (!window.confirm(`Tem certeza que deseja ${actionText} o usuário ${user.first_name || user.auth_users.email}?`)) {
      return;
    }

    toast.loading(`Atualizando status do usuário...`, { id: 'toggleStatus' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'toggleStatus' });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_banned: newBannedStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${actionText} usuário.`);
      }

      toast.success(`Usuário ${actionText} com sucesso!`, { id: 'toggleStatus' });
      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      console.error(`Erro ao ${actionText} usuário:`, err);
      toast.error(err.message || `Erro ao ${actionText} usuário.`, { id: 'toggleStatus' });
    }
  };

  const handleViewProjects = (user: UserProfile) => {
    setSelectedUserForProjects({ id: user.id, name: user.first_name || user.auth_users.email });
    setIsProjectsModalOpen(true);
  };

  const getUserStatus = (user: UserProfile) => {
    if (user.auth_users.banned_until) {
      return { text: 'Inativo', color: 'bg-red-100 text-red-800', icon: <Ban className="w-4 h-4" /> };
    }
    if (!user.auth_users.email_confirmed_at) {
      return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <Hourglass className="w-4 h-4" /> };
    }
    return { text: 'Ativo', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  // Calcular filteredUsers diretamente na renderização, garantindo que seja sempre um array
  const currentFilteredUsers = Array.isArray(users) ? users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.auth_users.email.toLowerCase();
    const role = user.role.toLowerCase();
    const status = getUserStatus(user).text.toLowerCase();

    const matchesSearch = searchTerm === '' ||
                          fullName.includes(searchTerm.toLowerCase()) ||
                          email.includes(searchTerm.toLowerCase()) ||
                          role.includes(searchTerm.toLowerCase()) ||
                          status.includes(searchTerm.toLowerCase());
                          
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }) : []; // Se 'users' não for um array, retorna um array vazio

  console.log('AdminUsersPage: users state (at render):', users);
  console.log('AdminUsersPage: currentFilteredUsers value (at render):', currentFilteredUsers);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando usuários...</p>
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
            Gerenciar Usuários
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            Cadastrar Novo Usuário
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email, função ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'All')}
              className="w-full md:w-auto pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todas as Funções</option>
              {UserSchema.shape.role.options.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
          {currentFilteredUsers.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Função
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
                <tbody className="divide-y divide-gray-800" key="user-table-body">
                  {console.log('AdminUsersPage: currentFilteredUsers IMMEDIATELY BEFORE MAP IN JSX:', currentFilteredUsers, typeof currentFilteredUsers, Array.isArray(currentFilteredUsers))}
                  {currentFilteredUsers.map((user) => {
                    const userStatus = getUserStatus(user);
                    const isSelf = user.id === currentAdminId;
                    return (
                      <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img className="h-8 w-8 rounded-full mr-3" src={user.avatar_url} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3">
                                {user.first_name && user.first_name.length > 0 ? user.first_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                              </div>
                            )}
                            <div className="text-sm font-medium text-white">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" /> {user.auth_users.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'client' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'dev' ? 'bg-green-100 text-green-800' :
                            user.role === 'copywriter' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800' // manager
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${userStatus.color}`}>
                            {userStatus.icon} {userStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" /> {new Date(user.auth_users.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewProjects(user)}
                            className="text-cyan-400 hover:text-cyan-300 mr-4"
                            title="Ver projetos deste usuário"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleResendAccess(user.auth_users.email)}
                            className="text-yellow-400 hover:text-yellow-300 mr-4"
                            title="Reenviar acesso"
                          >
                            <Mail className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`mr-4 ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isSelf ? 'Você não pode alterar seu próprio status' : (userStatus.text === 'Inativo' ? 'Ativar Usuário' : 'Inativar Usuário')}
                            disabled={isSelf}
                          >
                            {userStatus.text === 'Inativo' ? <ToggleRight className="w-5 h-5 text-green-400 hover:text-green-300" /> : <ToggleLeft className="w-5 h-5 text-red-400 hover:text-red-300" />}
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-400 hover:text-blue-300 mr-4"
                            title="Editar Usuário"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className={`text-red-400 hover:text-red-300 ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isSelf ? 'Você não pode deletar sua própria conta' : 'Deletar Usuário'}
                            disabled={isSelf}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={{ ...editingUser, is_banned: !!editingUser.auth_users.banned_until }} // Passar is_banned corretamente
          onSave={handleSaveUser}
          currentAdminId={currentAdminId!}
        />
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />

      {selectedUserForProjects && (
        <UserProjectsModal
          isOpen={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          userId={selectedUserForProjects.id}
          userName={selectedUserForProjects.name}
        />
      )}
    </div>
  );
}