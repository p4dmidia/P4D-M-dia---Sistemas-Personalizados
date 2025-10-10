"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, User, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/browserClient'; // Importar o cliente Supabase

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
  };
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchUsers();
  }, [navigate]);

  const handleEditUser = (userId: string) => {
    toast.info(`Editar usuário ${userId} (funcionalidade em breve!)`);
    // Implementar navegação para uma página de edição de usuário
  };

  const handleDeleteUser = async (userId: string) => {
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

        <h2 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Gerenciar Usuários
        </h2>

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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" /> {new Date(user.auth_users.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                          title="Editar Usuário"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Deletar Usuário"
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
    </div>
  );
}