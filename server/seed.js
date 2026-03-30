const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

const firstNames = [
  'João', 'Pedro', 'Lucas', 'Mateus', 'Gabriel', 'Felipe', 'Guilherme', 'Rafael', 'Gustavo', 'Bruno', 
  'André', 'Rodrigo', 'Tiago', 'Ricardo', 'Marcelo', 'Maria', 'Ana', 'Julia', 'Letícia', 'Beatriz', 
  'Mariana', 'Camila', 'Fernanda', 'Amanda', 'Bruna', 'Jéssica', 'Vanessa', 'Aline', 'Juliana', 'Priscila'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 
  'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Mendes', 'Nascimento', 'Lopes', 'Barbosa'
];

const categories = ['novoLeads', 'qualificado', 'agendado', 'confirmado', 'compareceu', 'noShow', 'perdido', 'posVenda'];

function generateName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const secondLast = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last} ${secondLast}`;
}

db.serialize(() => {
  console.log('Cleaning existing data...');
  db.run('DELETE FROM agendamentos');
  db.run('DELETE FROM clientes');

  console.log('Seeding clients with realistic names...');
  const clients = Array.from({ length: 45 }, (_, i) => {
    const nome = generateName();
    const emailBase = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
    return {
      nome: nome,
      telefone: `119${Math.floor(70000000 + Math.random() * 20000000)}`,
      email: `${emailBase}@gmail.com`,
      status: categories[i % categories.length],
      criadoEm: `2026-03-${(i % 25) + 1 < 10 ? '0'+((i%25)+1) : (i%25)+1}`
    };
  });

  const insertClient = db.prepare('INSERT INTO clientes (nome, telefone, email, status, criadoEm) VALUES (?, ?, ?, ?, ?)');
  clients.forEach(c => {
    insertClient.run(c.nome, c.telefone, c.email, c.status, c.criadoEm);
  });
  insertClient.finalize();

  console.log('Seeding appointments...');
  const servicos = ['Consultoria', 'Demonstração', 'Fechamento', 'Suporte'];
  const statusList = ['Confirmado', 'Agendado', 'No-show', 'Realizado'];
  
  db.all('SELECT id FROM clientes', [], (err, rows) => {
    if (err) throw err;
    
    const insertAppt = db.prepare('INSERT INTO agendamentos (clienteId, servico, data, horario, status, notas) VALUES (?, ?, ?, ?, ?, ?)');
    
    for (let i = 0; i < 60; i++) {
        const client = rows[i % rows.length];
        const dataStr = `2026-03-${(i % 30) + 1 < 10 ? '0'+((i%30)+1) : (i%30)+1}`;
        insertAppt.run(
            client.id,
            servicos[i % 4],
            dataStr,
            `${8 + (i % 10)}:00`,
            statusList[i % 4],
            'Nota real de atendimento persistida no SQLite.'
        );
    }
    insertAppt.finalize();
    
    console.log('Seeding completed successfully.');
    db.close();
  });
});
