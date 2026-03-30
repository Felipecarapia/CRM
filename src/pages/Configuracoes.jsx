import React, { useState } from 'react';
import { Save, Smartphone, Zap, Network, MessageSquare, Clock, Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import './Configuracoes.css';

const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState('integracoes');

  // Google Calendar Client ID — persistido no localStorage
  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('crm_google_client_id') || ''
  );
  const [clientIdInput, setClientIdInput] = useState(
    () => localStorage.getItem('crm_google_client_id') || ''
  );
  const [gcSaved, setGcSaved] = useState(
    () => !!localStorage.getItem('crm_google_client_id')
  );

  const handleSaveGoogleClientId = () => {
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;
    localStorage.setItem('crm_google_client_id', trimmed);
    setGoogleClientId(trimmed);
    setGcSaved(true);
    // Recarregar para o GoogleOAuthProvider novo ser montado com o ID correto
    setTimeout(() => window.location.reload(), 400);
  };

  const handleClearGoogleClientId = () => {
    localStorage.removeItem('crm_google_client_id');
    setGoogleClientId('');
    setClientIdInput('');
    setGcSaved(false);
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="configuracoes-page animate-fade-in">
      <div className="page-header flex-header">
        <div>
          <h1>Configurações do Sistema</h1>
          <p className="text-muted">Ajuste os horários, integrações e envio automático de mensagens.</p>
        </div>
        <button className="btn btn-primary">
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

      <div className="config-container glass-panel">
        <div className="config-sidebar">
          <button 
            className={`config-tab ${activeTab === 'empresa' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresa')}
          >
            <Network size={18} /> Dados da Empresa
          </button>
          <button 
            className={`config-tab ${activeTab === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            <Clock size={18} /> Horários e Serviços
          </button>
          <button 
            className={`config-tab ${activeTab === 'integracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('integracoes')}
          >
            <Zap size={18} /> Integrações e OpenClaw
          </button>
          <button 
            className={`config-tab ${activeTab === 'mensagens' ? 'active' : ''}`}
            onClick={() => setActiveTab('mensagens')}
          >
            <MessageSquare size={18} /> Mensagens Automáticas
          </button>
        </div>

        <div className="config-content">
          {activeTab === 'integracoes' && (
            <div className="animate-fade-in">
              <h2>Conexões de APIs</h2>
              <p className="text-muted mb-4">Conecte seu CRM com ferramentas externas para automatizar o funil.</p>

              <div className="integration-card">
                <div className="integration-header">
                  <div className="flex items-center gap-3">
                    <div className="icon-box whatsapp">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3>WhatsApp Cloud API</h3>
                      <p className="text-muted text-sm">Status: <strong>Desconectado</strong></p>
                    </div>
                  </div>
                  <button className="btn btn-secondary">Conectar</button>
                </div>
                <div className="integration-body mt-3">
                  <div className="input-group">
                    <label className="input-label">Token de Acesso (Bearer)</label>
                    <input type="password" placeholder="Insira o seu API Token..." className="input-field" />
                  </div>
                </div>
              </div>

              <div className="integration-card mt-4">
                <div className="integration-header">
                  <div className="flex items-center gap-3">
                    <div className="icon-box openclaw">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3>Automação OpenClaw</h3>
                      <p className="text-muted text-sm">Status: <strong style={{color: 'var(--color-success)'}}>Ativo</strong></p>
                    </div>
                  </div>
                  <button className="btn btn-secondary">Desconectar</button>
                </div>
                <div className="integration-body mt-3">
                  <div className="input-group">
                    <label className="input-label">Webhook URL (Para recebimento de No-Shows)</label>
                    <input type="text" defaultValue="https://app.openclaw.com/webhook/crm-trigger" className="input-field" />
                  </div>
                </div>
              </div>

              {/* Google Calendar Integration Card */}
              <div className="integration-card mt-4">
                <div className="integration-header">
                  <div className="flex items-center gap-3">
                    <div className="icon-box" style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.3)' }}>
                      <Calendar size={24} color="#4285F4" />
                    </div>
                    <div>
                      <h3>Google Calendar</h3>
                      <p className="text-muted text-sm">
                        Status:{' '}
                        {gcSaved
                          ? <strong style={{ color: 'var(--color-success)' }}><CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Client ID Configurado</strong>
                          : <strong style={{ color: '#888' }}><XCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />Não configurado</strong>
                        }
                      </p>
                    </div>
                  </div>
                  {gcSaved && (
                    <button className="btn btn-secondary" style={{ borderColor: 'rgba(255,23,68,0.4)', color: '#ff1744' }} onClick={handleClearGoogleClientId}>
                      Desconectar
                    </button>
                  )}
                </div>
                <div className="integration-body mt-3">
                  <div className="input-group">
                    <label className="input-label">OAuth 2.0 Client ID (Google Cloud Console)</label>
                    <input
                      type="text"
                      placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com"
                      className="input-field"
                      value={clientIdInput}
                      onChange={e => { setClientIdInput(e.target.value); setGcSaved(false); }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                      style={{ color: '#4285F4', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                      <ExternalLink size={13} /> Abrir Google Cloud Console
                    </a>
                    <button className="btn btn-primary" onClick={handleSaveGoogleClientId} disabled={!clientIdInput.trim() || gcSaved}>
                      <Save size={16} /> {gcSaved ? 'Salvo ✓' : 'Salvar e Ativar'}
                    </button>
                  </div>
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.78rem', color: '#555', lineHeight: '2' }}>
                    <strong style={{ color: '#777', display: 'block', marginBottom: '4px' }}>📋 Como gerar o Client ID:</strong>
                    1. <strong style={{ color: '#aaa' }}>Google Cloud Console</strong> → Crie um projeto (ex: Control CRM)<br/>
                    2. APIs e Serviços → Biblioteca → Ative a <strong style={{ color: '#4285F4' }}>Google Calendar API</strong><br/>
                    3. Credenciais → + Criar → ID Cliente OAuth 2.0 → Tipo: <strong style={{ color: '#aaa' }}>Aplicativo da Web</strong><br/>
                    4. Origens JS: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 8px', borderRadius: '4px', color: '#ccc' }}>http://localhost:5173</code><br/>
                    5. Cole o Client ID acima → <strong style={{ color: 'var(--color-primary)' }}>Salvar e Ativar</strong>
                  </div>
                </div>
              </div>

            </div>
          )}


          {activeTab === 'mensagens' && (
            <div className="animate-fade-in">
               <h2>Templates de Mensagens</h2>
               <p className="text-muted mb-4">Defina o que a OpenClaw e o WhatsApp enviarão nas mudanças do Kanban.</p>

               <div className="input-group">
                 <label className="input-label">📝 Lembrete de Agendamento (2 horas antes)</label>
                 <textarea 
                   className="input-field" 
                   rows={3} 
                   defaultValue="Olá {nome_cliente}! Lembramos do nosso agendamento hoje às {horario}. Aguardamos você! Confirme com SIM ou digite REMARCAR."
                 />
               </div>

               <div className="input-group mt-3">
                 <label className="input-label">⚠️ Follow-up para No-show</label>
                 <textarea 
                   className="input-field" 
                   rows={3} 
                   defaultValue="Poxa {nome_cliente}, não conseguimos nos encontrar hoje. Vamos remarcar para não perdermos a oportunidade?"
                 />
               </div>
            </div>
          )}
          
          {(activeTab === 'empresa' || activeTab === 'horarios') && (
            <div className="animate-fade-in placeholder-tab">
               <h2>Em Construção...</h2>
               <p className="text-muted">A interface está pré-renderizada para visualização futura.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
