
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: true,
    service: 'Lead Dial MCP server working',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Lead Dial API Server',
    endpoints: {
      'GET /test': 'Test endpoint'
    }
  });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Node API running at http://0.0.0.0:${PORT}`);
  console.log(`📡 Local access: http://localhost:${PORT}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/test`);
});