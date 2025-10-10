"use client";

import React, { useState } from 'react';
import { X, Save, DollarSign, User, Calendar, Tag } from 'lucide-react';
import { Subscription } from '@/shared/types';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  users: { id: string; email: string; first_name: string | null; last_name: string | null }[];
}

const subscriptionStatusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'active', label: 'Ativa' },
  { value: 'canceled', label: 'Cancelada' },
  { value: 'overdue', label: 'Atrasada' },
];

export default function CreateSubscriptionModal({ isOpen, onClose, onCreate, users }: CreateSubscriptionModalProps) {
  const [userId, setUserId] = useState('');
  const [asaasSubscriptionId, setAsaasSubscriptionId] = useState('');
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [status, setStatus] = useState('pending');
  const [nextDueDate, setNextDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '') {
      alert('O valor é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        user_id: userId,
        asaas_subscription_id: asaasSubscriptionId || undefined,
        plan_name: planName,
        amount: amount as number,
        status,
        next_due_date: nextDueDate ? new Date(nextDueDate).toISOString() : null,
      });
      // Reset form
      setUserId('');
      setAsaasSubscriptionId('');
      setPlanName('');
      setAmount('');
      setStatus('pending');
      setNextDueDate('');
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
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Criar Nova Assinatura</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subUserId" className="block text-sm font-medium text-gray-300 mb-2">
              Usuário (Cliente) *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="subUserId"
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
            <label htmlFor="subPlanName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Plano *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="subPlanName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: E-commerce de Alta Conversão"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="subAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Valor *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                id="subAmount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 49.90"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="subStatus" className="block text-sm font-medium text-gray-300 mb-2">
              Status *
            </label>
            <div className="relative">
              <select
                id="subStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {subscriptionStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subNextDueDate" className="block text-sm font-medium text-gray-300 mb-2">
              Próximo Vencimento (opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                id="subNextDueDate"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="asaasSubscriptionId" className="block text-sm font-medium text-gray-300 mb-2">
              ID da Assinatura Asaas (opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                id="asaasSubscriptionId"
                value={asaasSubscriptionId}
                onChange={(e) => setAsaasSubscriptionId(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID do Asaas, se aplicável"
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
              {loading ? 'Criando...' : 'Criar Assinatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}