require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: 'http://localhost:8000', // Update if your frontend uses different port
  methods: ['GET', 'POST']
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});