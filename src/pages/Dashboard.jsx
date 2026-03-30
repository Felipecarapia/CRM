import React, { useMemo } from 'react';
import useStore from '../store/useStore';
import { Users, CalendarCheck, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const agendamentos = useStore(state => state.agendamentos);
  const clientes = useStore(state => state.clientes);
  const getKanbanCards = useStore(state => state.getKanbanCards);
  
  const kanbanCards = getKanbanCards();

  // Totais do Dashboard
  const hoje = '2026-03-30';
  const totalLTV = clientes.reduce((acc, c) => acc + (c.ltv || 0), 0);

  const formatLTV = (val) => val === 0 ? '0' : 'R$ ' + (val / 1000).toFixed(1) + 'k';

  // --- Processamento Recharts: BarChart (Kanban Funil) ---
  const barData = useMemo(() => [
    { name: 'Novos', leads: kanbanCards.novoLeads.length },
    { name: 'Qualif', leads: kanbanCards.qualificado.length },
    { name: 'Agend', leads: kanbanCards.agendado.length },
    { name: 'Conf', leads: kanbanCards.confirmado.length },
    { name: 'Comp', leads: kanbanCards.compareceu.length },
    { name: 'Falta', leads: kanbanCards.noShow.length },
    { name: 'Perd', leads: kanbanCards.perdido.length },
    { name: 'PósV', leads: kanbanCards.posVenda.length },
  ], [kanbanCards]);

  // --- Processamento Recharts: AreaChart (LTV Histórico) ---
  const areaData = useMemo(() => {
    const meses = ['01', '02', '03', '04', '05', '06'];
    const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    let acm = 0;
    
    return meses.map((mes, index) => {
      const somaMes = clientes
        .filter(c => c.criadoEm.startsWith(`2026-${mes}`))
        .reduce((sum, c) => sum + c.ltv, 0);
      acm += somaMes;
      return {
        name: shortNames[index],
        receita: acm
      };
    });
  }, [clientes]);

  // Tooltip customizada Profissional
  const CustomTooltip = ({ active, payload, label, isCurrency }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>{label}</p>
          <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {isCurrency ? formatLTV(payload[0].value) : `${payload[0].value} Leads`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Visão Geral</h1>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">Total de Clientes</span>
            <div className="metric-icon-wrapper">
              <Users size={20} color="var(--color-primary)" />
            </div>
          </div>
          <h3 className="metric-value">{clientes.length}</h3>
          <div className="metric-footer">
             <span className="metric-trend up"><ArrowUpRight size={14} /> 12%</span>
             <span className="metric-trend-text">mês atual</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">Agendamentos</span>
            <div className="metric-icon-wrapper">
              <CalendarCheck size={20} color="var(--color-primary)" />
            </div>
          </div>
          <h3 className="metric-value">{agendamentos.length}</h3>
          <div className="metric-footer">
             <span className="metric-trend zero">- Total</span>
             <span className="metric-trend-text">na base</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">Taxa de No-Show</span>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle size={20} color="var(--color-danger)" />
            </div>
          </div>
          <h3 className="metric-value">{kanbanCards.noShow.length}</h3>
          <div className="metric-footer">
             <span className="metric-trend down"><ArrowDownRight size={14} /> 2%</span>
             <span className="metric-trend-text">melhoria</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">LTV Acumulado</span>
            <div className="metric-icon-wrapper">
              <TrendingUp size={20} color="var(--color-primary)" />
            </div>
          </div>
          <h3 className="metric-value">
            {formatLTV(totalLTV).replace('R$ ', '')}
          </h3>
          <div className="metric-footer">
             <span className="metric-trend up"><ArrowUpRight size={14} /> R$ 4.2k</span>
             <span className="metric-trend-text">esta semana</span>
          </div>
        </div>
      </div>

      <div className="charts-container" style={{marginBottom: '48px'}}>
        <div className="chart-wrapper">
          <div className="chart-header">
             <span className="chart-title">Crescimento de Receita (LTV)</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorPrimary)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-wrapper">
          <div className="chart-header">
             <span className="chart-title">Distribuição do Funil</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <Tooltip content={<CustomTooltip isCurrency={false} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar 
                    dataKey="leads" 
                    fill="var(--color-primary)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <h2 className="title-slanted" style={{ fontSize: '1.25rem' }}>Próximos Agendamentos</h2>
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
               <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Data</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Horário</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Serviço</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
               </tr>
            </thead>
            <tbody>
               {agendamentos.slice(0, 5).map((ag, idx) => (
                 <tr key={ag.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-muted)' }}>{ag.data}</td>
                    <td style={{ padding: '16px 24px' }}><strong>{ag.horario}</strong></td>
                    <td style={{ padding: '16px 24px', color: '#fff', fontWeight: 500 }}>{ag.cliente}</td>
                    <td style={{ padding: '16px 24px' }}>{ag.servico}</td>
                    <td style={{ padding: '16px 24px' }}>
                       <span style={{
                         padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                         background: ag.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                         color: ag.status === 'Confirmado' ? 'var(--color-success)' : 'var(--color-primary)'
                       }}>
                         {ag.status}
                       </span>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Dashboard;
