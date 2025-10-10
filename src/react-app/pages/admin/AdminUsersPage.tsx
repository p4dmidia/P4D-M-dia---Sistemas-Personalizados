"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, User, Mail, Calendar, Edit, Trash2, UserPlus, Ban, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient'; // Importar o cliente Supabase
import EditUserModal from '@/react-app/components/admin/EditUserModal';
import CreateUserModal from '@/react-app/components/admin/CreateUserModal';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'client' | 'admin';
  updated_at: string;
  asaas_customer_id: string | null;
  auth_users: {
    email: string;
    created_at: string;
    banned_until: string | null; // Adicionado para status de bloqueio
  };
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar usuários.');
      }

      const data: UserProfile[] = await response.json();
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
    data: { first_name?: string; last_name?: string; email?: string; role?: 'client' | 'admin'; is_banned?: boolean }
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar usuário.');
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar usuário.');
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      toast.success('Usuário deletado com sucesso!', { id: 'deleteUser' });
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      toast.error(err.message || 'Erro ao deletar usuário.', { id: 'deleteUser' });
    }
  };

  const handleCreateUser = async (
    data: { first_name: string; last_name: string; email: string; password: string; role: 'client' | 'admin' }
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
          name: data.first_name, // Passa first_name como 'name' para o worker
          role: data.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao cadastrar usuário.');
      }

      toast.success('Usuário cadastrado com sucesso!', { id: 'createUser' });
      fetchUsers(); // Re-fetch users to update the list
    } catch (err: any) {
      console.error('Erro ao cadastrar usuário:', err);
      toast.error(err.message || 'Erro ao cadastrar usuário.', { id: 'createUser' });
    }
  };

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

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
          {users.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
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
                <tbody className="divide-y divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.avatar_url ? (
                            <img className="h-8 w-8 rounded-full mr-3" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3">
                              {user.first_name ? user.first_name[0] : <User className="w-4 h-4" />}
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
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.auth_users.banned_until ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.auth_users.banned_until ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" /> {new Date(user.auth_users.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                          title="Editar Usuário"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className={`text-red-400 hover:text-red-300 ${user.id === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={user.id === currentAdminId ? 'Você não pode deletar sua própria conta' : 'Deletar Usuário'}
                          disabled={user.id === currentAdminId}
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

      {editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={editingUser}
          onSave={handleSaveUser}
          currentAdminId={currentAdminId!}
        />
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
}