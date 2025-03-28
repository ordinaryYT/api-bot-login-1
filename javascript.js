require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();

// Configure CORS for Vercel
const allowedOrigins = [
  'https://your-frontend.vercel.app', // Your Vercel frontend URL
  'http://localhost:8000'             // For local testing
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

let botManager = null;

// API Endpoints
app.post('/start', async (req, res) => {
  try {
    if (botManager) {
      return res.status(400).json({ 
        success: false,
        message: 'Bots are already running' 
      });
    }

    botManager = new FNLB();
    await botManager.start({
      apiToken: process.env.FNLB_API_TOKEN, // Set in Vercel env vars
      botsPerShard: 10
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

app.post('/stop', async (req, res) => {
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

app.get('/status', (req, res) => {
  res.json({
    running: !!botManager
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;