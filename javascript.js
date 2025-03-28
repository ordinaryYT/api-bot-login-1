require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());

// Bot manager instance
let botManager = null;

// API Routes
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    botsRunning: !!botManager
  });
});

// Start bots endpoint
router.post('/bots/start', async (req, res) => {
  try {
    if (botManager) {
      return res.status(400).json({
        success: false,
        message: 'Bots are already running'
      });
    }

    botManager = new FNLB();
    
    await botManager.start({
      apiToken: process.env.FNLB_API_TOKEN || 'DGfCBefvjOU-UORpSFBh8gbArVEGkKK5xb-BB7kZk8NfEFj6hiCf8v2Nefu6',
      botsPerShard: 20
    });

    res.json({
      success: true,
      message: 'Bots started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start bots'
    });
  }
});

// Stop bots endpoint
router.post('/bots/stop', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(400).json({
        success: false,
        message: 'No bots are currently running'
      });
    }

    await botManager.stop();
    botManager = null;

    res.json({
      success: true,
      message: 'Bots stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop bots'
    });
  }
});

// Status endpoint
router.get('/bots/status', (req, res) => {
  res.json({
    running: !!botManager,
    timestamp: new Date().toISOString()
  });
});

// Mount API router
app.use('/api', router);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('API Endpoints:');
  console.log(`- GET    /api/health`);
  console.log(`- POST   /api/bots/start`);
  console.log(`- POST   /api/bots/stop`);
  console.log(`- GET    /api/bots/status`);
});