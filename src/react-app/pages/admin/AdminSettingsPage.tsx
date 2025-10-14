"use client";

import { useEffect, useState } from 'react'; // Removido importação explícita de React
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, Globe, Bell, Palette, Save } from 'lucide-react'; // Removido Settings, Info
import { supabase } from '@/integrations/supabase/browserClient';

interface SystemSettings {
  site_name: string;
  contact_email: string;
  whatsapp_number: string;
  admin_notification_email: string;
  logo_url: string;
  primary_color_hex: string;
}

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: '',
    contact_email: '',
    whatsapp_number: '',
    admin_notification_email: '',
    logo_url: '',
    primary_color_hex: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.access_token) {
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          navigate('/login');
          return;
        }

        const response = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar configurações.');
        }

        const data: SystemSettings = await response.json();
        setSettings(prev => ({ ...prev, ...data })); // Merge fetched settings with default
      } catch (err: any) {
        console.error('Erro ao buscar configurações:', err);
        setError(err.message || 'Erro ao carregar configurações.');
        toast.error(err.message || 'Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    toast.loading('Salvando configurações...', { id: 'saveSettings' });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.access_token) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', { id: 'saveSettings' });
        navigate('/login');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar configurações.');
      }

      toast.success('Configurações salvas com sucesso!', { id: 'saveSettings' });
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      toast.error(err.message || 'Erro ao salvar configurações.', { id: 'saveSettings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-xl">Carregando configurações do sistema...</p>
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
          Configurações do Sistema
        </h2>

        <form onSubmit={handleSaveSettings} className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700 space-y-8">
          {/* Configurações Gerais */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-400" /> Configurações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="site_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Site
                </label>
                <input
                  type="text"
                  id="site_name"
                  name="site_name"
                  value={settings.site_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="P4D Mídia"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email de Contato
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={settings.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contato@p4dmidia.com"
                />
              </div>
              <div>
                <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-300 mb-2">
                  Número do WhatsApp
                </label>
                <input
                  type="tel"
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={settings.whatsapp_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Bell className="w-6 h-6 text-purple-400" /> Notificações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="admin_notification_email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email de Notificação do Admin
                </label>
                <input
                  type="email"
                  id="admin_notification_email"
                  name="admin_notification_email"
                  value={settings.admin_notification_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@p4dmidia.com"
                />
              </div>
            </div>
          </div>

          {/* Personalização */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Palette className="w-6 h-6 text-pink-400" /> Personalização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
                  URL do Logotipo
                </label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={settings.logo_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://seusite.com/logo.png"
                />
              </div>
              <div>
                <label htmlFor="primary_color_hex" className="block text-sm font-medium text-gray-300 mb-2">
                  Cor Primária (Hex)
                </label>
                <input
                  type="text"
                  id="primary_color_hex"
                  name="primary_color_hex"
                  value={settings.primary_color_hex}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#4A90E2"
                />
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}