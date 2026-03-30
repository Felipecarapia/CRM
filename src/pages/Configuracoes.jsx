import React, { useState } from 'react';
import { Save, Smartphone, Zap, Network, MessageSquare, Clock, Calendar, CheckCircle, XCircle, ExternalLink, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import './Configuracoes.css';

const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState('empresa');

  const [empresaData, setEmpresaData] = useState({
    nome: 'Minha Empresa',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: ''
  });

  const [horarioData, setHorarioData] = useState({
    abre: '08:00',
    fecha: '18:00',
    intervalo: '12:00',
    diasUteis: '1,2,3,4,5'
  });

  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('crm_google_client_id') || ''
  );
  const [clientIdInput, setClientIdInput] = useState(
    () => localStorage.getItem('crm_google_client_id') || ''
  );
  const [gcSaved, setGcSaved] = useState(
    () => !!localStorage.getItem('crm_google_client_id')
  );

  const [mensagens, setMensagens] = useState({
    lembrete: 'Olá {nome_cliente}! Lembramos do nosso agendamento hoje às {horario}. Aguardamos você!',
    followup: 'Poxa {nome_cliente}, não conseguimos nos encontrar hoje. Vamos remarcar?',
    confirmacao: 'Olá {nome_cliente}! Seu agendamento foi confirmado para {data} às {horario}.'
  });

  const handleSaveGoogleClientId = () => {
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;
    localStorage.setItem('crm_google_client_id', trimmed);
    setGoogleClientId(trimmed);
    setGcSaved(true);
    setTimeout(() => window.location.reload(), 400);
  };

  const handleClearGoogleClientId = () => {
    localStorage.removeItem('crm_google_client_id');
    setGoogleClientId('');
    setClientIdInput('');
    setGcSaved(false);
    setTimeout(() => window.location.reload(), 400);
  };

  const handleSaveEmpresa = () => {
    localStorage.setItem('crm_empresa', JSON.stringify(empresaData));
    alert('Dados da empresa salvos!');
  };

  const handleSaveHorarios = () => {
    localStorage.setItem('crm_horarios', JSON.stringify(horarioData));
    alert('Horários salvos!');
  };

  const handleSaveMensagens = () => {
    localStorage.setItem('crm_mensagens', JSON.stringify(mensagens));
    alert('Mensagens salvas!');
  };

  return (
    <div className="configuracoes-page animate-fade-in">
      <div className="page-header flex-header">
        <div>
          <h1>Configurações</h1>
          <p className="text-muted">Gerencie as informações do seu negócio</p>
        </div>
      </div>

      <div className="config-container glass-panel">
        <div className="config-sidebar">
          <div className="config-sidebar-header">
            <span className="config-sidebar-title">Configurações</span>
          </div>
          <button 
            className={`config-tab ${activeTab === 'empresa' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresa')}
          >
            <Building2 size={18} /> Dados da Empresa
          </button>
          <button 
            className={`config-tab ${activeTab === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            <Clock size={18} /> Horários
          </button>
          <button 
            className={`config-tab ${activeTab === 'integracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('integracoes')}
          >
            <Zap size={18} /> Integrações
          </button>
          <button 
            className={`config-tab ${activeTab === 'mensagens' ? 'active' : ''}`}
            onClick={() => setActiveTab('mensagens')}
          >
            <MessageSquare size={18} /> Mensagens
          </button>
        </div>

        <div className="config-content">
          {activeTab === 'empresa' && (
            <div className="animate-fade-in">
              <h2>Dados da Empresa</h2>
              <p className="text-muted mb-4">Informações básicas do seu negócio</p>

              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3>Informações Gerais</h3>
                    <p className="text-muted" style={{fontSize: '0.85rem', marginTop: 4}}>Dados que aparecerão nos relatórios</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nome da Empresa</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={empresaData.nome}
                      onChange={(e) => setEmpresaData({...empresaData, nome: e.target.value})}
                      placeholder="Ex: Centro Automotivo XPTO"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CNPJ</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={empresaData.cnpj}
                      onChange={(e) => setEmpresaData({...empresaData, cnpj: e.target.value})}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input 
                      type="tel" 
                      className="form-input"
                      value={empresaData.telefone}
                      onChange={(e) => setEmpresaData({...empresaData, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={empresaData.email}
                      onChange={(e) => setEmpresaData({...empresaData, email: e.target.value})}
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Endereço</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={empresaData.endereco}
                      onChange={(e) => setEmpresaData({...empresaData, endereco: e.target.value})}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={empresaData.cidade}
                      onChange={(e) => setEmpresaData({...empresaData, cidade: e.target.value})}
                      placeholder="São Paulo"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={empresaData.estado}
                      onChange={(e) => setEmpresaData({...empresaData, estado: e.target.value})}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="btn-group">
                  <button className="btn btn-primary" onClick={handleSaveEmpresa}>
                    <Save size={16} /> Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'horarios' && (
            <div className="animate-fade-in">
              <h2>Horários de Funcionamento</h2>
              <p className="text-muted mb-4">Defina quando sua empresa atende os clientes</p>

              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3>Horário de Atendimento</h3>
                    <p className="text-muted" style={{fontSize: '0.85rem', marginTop: 4}}>Configure o horário de trabalho</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Abre às</label>
                    <input 
                      type="time" 
                      className="form-input"
                      value={horarioData.abre}
                      onChange={(e) => setHorarioData({...horarioData, abre: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha às</label>
                    <input 
                      type="time" 
                      className="form-input"
                      value={horarioData.fecha}
                      onChange={(e) => setHorarioData({...horarioData, fecha: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Intervalo (almoço)</label>
                    <input 
                      type="time" 
                      className="form-input"
                      value={horarioData.intervalo}
                      onChange={(e) => setHorarioData({...horarioData, intervalo: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dias úteis (1=Seg, 7=Dom)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={horarioData.diasUteis}
                      onChange={(e) => setHorarioData({...horarioData, diasUteis: e.target.value})}
                      placeholder="1,2,3,4,5"
                    />
                  </div>
                </div>

                <div className="btn-group">
                  <button className="btn btn-primary" onClick={handleSaveHorarios}>
                    <Save size={16} /> Salvar Horários
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integracoes' && (
            <div className="animate-fade-in">
              <h2>Integrações</h2>
              <p className="text-muted mb-4">Conecte ferramentas externas ao seu CRM</p>

              <div className="section-card">
                <div className="section-header">
                  <div className="icon-box whatsapp">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3>WhatsApp Cloud API</h3>
                    <span className="status-badge inactive">
                      <XCircle size={12} /> Desconectado
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Token de Acesso (Bearer)</label>
                  <input 
                    type="password" 
                    className="form-input"
                    placeholder="Cole seu token aqui..." 
                  />
                </div>

                <div className="btn-group">
                  <button className="btn btn-primary">
                    <Zap size={16} /> Conectar
                  </button>
                  <button className="btn-secondary">
                    Documentação
                  </button>
                </div>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3>Google Calendar</h3>
                    <span className={`status-badge ${gcSaved ? 'active' : 'inactive'}`}>
                      {gcSaved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {gcSaved ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">OAuth 2.0 Client ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 123456789-abc.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={e => { setClientIdInput(e.target.value); setGcSaved(false); }}
                  />
                </div>

                <div className="btn-group">
                  {gcSaved ? (
                    <button className="btn-secondary" style={{borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444'}} onClick={handleClearGoogleClientId}>
                      Desconectar
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleSaveGoogleClientId} disabled={!clientIdInput.trim()}>
                      <Save size={16} /> Salvar
                    </button>
                  )}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{textDecoration: 'none'}}
                  >
                    <ExternalLink size={16} /> Google Cloud Console
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div className="animate-fade-in">
              <h2>Mensagens Automáticas</h2>
              <p className="text-muted mb-4">Configure os templates de mensagens enviadas aos clientes</p>

              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3>Templates de Mensagens</h3>
                    <p className="text-muted" style={{fontSize: '0.85rem', marginTop: 4}}>Use {nome_cliente}, {data}, {horario} como variáveis</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lembrete de Agendamento</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    value={mensagens.lembrete}
                    onChange={(e) => setMensagens({...mensagens, lembrete: e.target.value})}
                    placeholder="Olá {nome_cliente}! Lembramos do agendamento..."
                  />
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Follow-up (Cliente não compareceu)</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    value={mensagens.followup}
                    onChange={(e) => setMensagens({...mensagens, followup: e.target.value})}
                    placeholder="Poxa {nome_cliente}, não conseguimos..."
                  />
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Confirmação de Agendamento</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    value={mensagens.confirmacao}
                    onChange={(e) => setMensagens({...mensagens, confirmacao: e.target.value})}
                    placeholder="Olá {nome_cliente}! Agendamento confirmado..."
                  />
                </div>

                <div className="btn-group">
                  <button className="btn btn-primary" onClick={handleSaveMensagens}>
                    <Save size={16} /> Salvar Mensagens
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
