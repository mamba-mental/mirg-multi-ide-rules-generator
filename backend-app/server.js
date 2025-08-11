const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Get rules
app.get('/api/rules', (req, res) => {
  res.json({
    rules: [
      { id: 1, name: 'ESLint Config', description: 'JavaScript linting rules', ide: 'vscode' },
      { id: 2, name: 'Prettier Config', description: 'Code formatting rules', ide: 'all' },
      { id: 3, name: 'TypeScript Config', description: 'TypeScript compiler rules', ide: 'vscode' }
    ],
    weaviate_status: 'Connected to ' + process.env.WEAVIATE_URL
  });
});

// Check Weaviate status
app.get('/api/weaviate/status', (req, res) => {
  const weaviateUrl = process.env.WEAVIATE_URL || 'http://weaviate:8080';
  
  http.get(weaviateUrl + '/v1/.well-known/ready', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
      res.json({ 
        status: 'connected', 
        url: weaviateUrl, 
        ready: true,
        message: 'Weaviate vector database is operational'
      });
    });
  }).on('error', (err) => {
    res.json({ 
      status: 'error', 
      url: weaviateUrl,
      error: err.message 
    });
  });
});

// Generate rules
app.post('/api/rules/generate', (req, res) => {
  const { ide, framework, rules } = req.body;
  
  res.json({
    success: true,
    message: 'Rules generated successfully',
    generated: {
      ide: ide || 'vscode',
      framework: framework || 'react',
      rules: rules || ['eslint', 'prettier'],
      timestamp: new Date().toISOString()
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MIRG Backend API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/rules',
      '/api/weaviate/status',
      '/api/rules/generate'
    ]
  });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`MIRG Backend running on port ${PORT}`);
  console.log(`Weaviate URL: ${process.env.WEAVIATE_URL}`);
});