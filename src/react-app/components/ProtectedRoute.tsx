"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/browserClient';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Ex: ['admin'], ['client']
  redirectPath?: string; // Caminho para redirecionar se não autorizado
}

export default function ProtectedRoute({ children, allowedRoles, redirectPath = '/login' }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error('Você precisa estar logado para acessar esta página.');
        navigate(redirectPath);
        return;
      }

      // Buscar perfil para obter a função (role)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 significa "nenhuma linha encontrada"
        console.error('Erro ao buscar perfil do usuário:', profileError);
        toast.error('Erro ao carregar seu perfil.');
        navigate(redirectPath);
        return;
      }

      const userRole = profileData?.role || 'client'; // Padrão para 'client' se a função não for encontrada

      if (allowedRoles && allowedRoles.length > 0) {
        if (allowedRoles.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          toast.error('Acesso negado. Você não tem permissão para acessar esta página.');
          // Redirecionar para um local mais apropriado, ex: o próprio dashboard do usuário
          navigate(userRole === 'client' ? '/dashboard' : redirectPath);
        }
      } else {
        // Se nenhuma função específica for exigida, apenas estar logado é suficiente
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuthorization();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        // Se o usuário sair, redirecionar
        navigate(redirectPath);
      } else {
        // Re-verificar autorização se a sessão mudar (ex: usuário atualiza perfil/função)
        checkAuthorization();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, allowedRoles, redirectPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Verificando acesso...</p>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}