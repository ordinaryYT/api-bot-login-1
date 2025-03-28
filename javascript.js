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

// API Endpoints
app.post('/api/bots/start', async (req, res) => {
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
      message: 'Bots started successfully' 
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start bots'
    });
  }
});

app.post('/api/bots/stop', async (req, res) => {
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
      message: 'Bots stopped successfully'
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop bots'
    });
  }
});

app.get('/api/bots/status', (req, res) => {
  res.json({
    running: !!botManager
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});