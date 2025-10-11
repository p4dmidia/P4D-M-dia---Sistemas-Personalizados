"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <div className="max-w-4xl mx-auto py-12">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors mb-8 w-fit"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar para o Início
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Termos de Uso
        </h1>

        <div className="bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-700 space-y-6 text-gray-300 leading-relaxed">
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Termos</h2>
          <p>Ao acessar ao site P4D Mídia, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Uso de Licença</h2>
          <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site P4D Mídia , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>modificar ou copiar os materiais;</li>
            <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
            <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site P4D Mídia;</li>
            <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
            <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
          </ul>
          <p>Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por P4D Mídia a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrônico ou impresso.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Isenção de responsabilidade</h2>
          <p>Os materiais no site da P4D Mídia são fornecidos 'como estão'. P4D Mídia não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos. Além disso, o P4D Mídia não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Limitações</h2>
          <p>Em nenhum caso o P4D Mídia ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em P4D Mídia, mesmo que P4D Mídia ou um representante autorizado da P4D Mídia tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Precisão dos materiais</h2>
          <p>Os materiais exibidos no site da P4D Mídia podem incluir erros técnicos, tipográficos ou fotográficos. P4D Mídia não garante que qualquer material em seu site seja preciso, completo ou atual. P4D Mídia pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, P4D Mídia não se compromete a atualizar os materiais.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Links</h2>
          <p>O P4D Mídia não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por P4D Mídia do site. O uso de qualquer site vinculado é por conta e risco do usuário.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Modificações</h2>
          <p>O P4D Mídia pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Lei aplicável</h2>
          <p>Estes termos e condições são regidos e interpretados de acordo com as leis do P4D Mídia e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.</p>
        </div>
      </div>
    </div>
  );
}