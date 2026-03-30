import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import useStore from './store/useStore';

// Pages - dynamically loaded or directly imported
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import Kanban from './pages/Kanban';
import Clientes from './pages/Clientes';
import Colaboradores from './pages/Colaboradores';
import Configuracoes from './pages/Configuracoes';
import Servicos from './pages/Servicos';

function App() {
  const fetchData = useStore(state => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agendamentos" element={<Agendamentos />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/colaboradores" element={<Colaboradores />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/servicos" element={<Servicos />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
