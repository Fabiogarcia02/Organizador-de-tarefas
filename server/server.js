const express = require('express');
const jsonServer = require('json-server');
const path = require('path');

const app = express();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Servir arquivos estáticos da pasta public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// API fake do JSON Server em /api
app.use('/api', middlewares, router);



// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
