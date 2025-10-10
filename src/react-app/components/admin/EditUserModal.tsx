"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Briefcase, Ban } from 'lucide-react';
import { UserSchema } from '@/shared/types'; // Importar UserSchema para os tipos de role

type UserRole = z.infer<typeof UserSchema.shape.role>; // Definir UserRole a partir do schema

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: UserRole; // Usar o tipo UserRole
    is_banned: boolean;
  };
  onSave: (userId: string, data: { first_name?: string; last_name?: string; email?: string; role?: UserRole; is_banned?: boolean }) => Promise<void>;
  currentAdminId: string; // ID do admin logado
}

export default function EditUserModal({ isOpen, onClose, user, onSave, currentAdminId }: EditUserModalProps) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role); // Usar o tipo UserRole
  const [isBanned, setIsBanned] = useState(user.is_banned);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email);
      setRole(user.role);
      setIsBanned(user.is_banned);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(user.id, {
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        is_banned: isBanned,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSelfEditing = user.id === currentAdminId;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Editar Usuário</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Sobrenome
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sobrenome"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Função
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelfEditing} // Admin não pode mudar a própria função
                className={`w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelfEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {UserSchema.shape.role.options.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {isSelfEditing && <p className="text-sm text-gray-400 mt-2">Você não pode alterar sua própria função.</p>}
          </div>

          <div className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg p-4">
            <label htmlFor="isBanned" className="flex items-center text-lg font-medium text-gray-300 cursor-pointer">
              <Ban className="w-6 h-6 mr-3 text-red-400" />
              Bloquear Usuário
            </label>
            <input
              type="checkbox"
              id="isBanned"
              checked={isBanned}
              onChange={(e) => setIsBanned(e.target.checked)}
              disabled={isSelfEditing} // Admin não pode bloquear a si mesmo
              className={`form-checkbox h-6 w-6 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500 ${isSelfEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          {isSelfEditing && <p className="text-sm text-gray-400 mt-2">Você não pode bloquear a si mesmo.</p>}

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