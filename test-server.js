import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/test', (req, res) => {
  console.log('Test auth request received:', req.body);
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  console.log(`🔍 Test health: http://localhost:${PORT}/health`);
});