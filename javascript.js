require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// State management
let botManager = null;
const botStates = Array(10).fill(false);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    botsRunning: !!botManager
  });
});

// Start bots endpoint
app.post('/api/bots/start', async (req, res) => {
  try {
    if (botManager) {
      return res.status(400).json({
        success: false,
        message: 'Bots are already running',
        timestamp: new Date().toISOString()
      });
    }

    botManager = new FNLB();
    await botManager.start({
      apiToken: process.env.FNLB_API_TOKEN || 'DGfCBefvjOU-UORpSFBh8gbArVEGkKK5xb-BB7kZk8NfEFj6hiCf8v2Nefu6',
      botsPerShard: 20
    });

    // Update all bot states
    botStates.fill(true);

    res.status(200).json({
      success: true,
      message: 'Successfully started all bots',
      timestamp: new Date().toISOString(),
      botStates: botStates
    });
  } catch (error) {
    console.error('Bot startup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start bots',
      timestamp: new Date().toISOString()
    });
  }
});

// Stop bots endpoint
app.post('/api/bots/stop', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(400).json({
        success: false,
        message: 'No bots are currently running',
        timestamp: new Date().toISOString()
      });
    }

    await botManager.stop();
    botManager = null;
    botStates.fill(false);

    res.status(200).json({
      success: true,
      message: 'Successfully stopped all bots',
      timestamp: new Date().toISOString(),
      botStates: botStates
    });
  } catch (error) {
    console.error('Bot shutdown error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stop bots',
      timestamp: new Date().toISOString()
    });
  }
});

// Bot status endpoint
app.get('/api/bots/status', (req, res) => {
  res.status(200).json({
    running: !!botManager,
    timestamp: new Date().toISOString(),
    botStates: botStates
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`- POST   /api/bots/start`);
  console.log(`- POST   /api/bots/stop`);
  console.log(`- GET    /api/bots/status`);
  console.log(`- GET    /api/health`);
});