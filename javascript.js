require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');
const path = require('path');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Bot control variables
let botController = null;
let botsRunning = false;

// API Endpoints
app.post('/api/bots/start', async (req, res) => {
    try {
        if (botsRunning) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bots are already running' 
            });
        }

        botController = new FNLB();
        await botController.start({
            apiToken: process.env.FNLB_API_TOKEN || 'your_api_token_here',
            botsPerShard: 10
        });

        botsRunning = true;
        res.json({ 
            success: true, 
            message: 'Bots started successfully',
            running: true
        });
    } catch (error) {
        console.error('Error starting bots:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/bots/stop', async (req, res) => {
    try {
        if (!botsRunning || !botController) {
            return res.status(400).json({ 
                success: false, 
                message: 'No bots are currently running' 
            });
        }

        await botController.stop();
        botController = null;
        botsRunning = false;

        res.json({ 
            success: true, 
            message: 'Bots stopped successfully',
            running: false
        });
    } catch (error) {
        console.error('Error stopping bots:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.get('/api/bots/status', (req, res) => {
    res.json({ 
        running: botsRunning,
        bots: Array(10).fill({ status: botsRunning ? 'active' : 'inactive' })
    });
});

// Handle all other routes - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bot control API available at http://localhost:${PORT}/api/bots`);
});