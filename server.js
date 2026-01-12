
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Lead Dial API',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Lead Dial API Server',
    endpoints: {
      'POST /lead-details': 'Process lead data',
      'GET /health': 'Health check'
    }
  });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Node API running at http://0.0.0.0:${PORT}`);
  console.log(`📡 Local access: http://localhost:${PORT}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/lead-details`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});