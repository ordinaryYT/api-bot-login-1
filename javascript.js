require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FNLB = require('fnlb');

const app = express();
app.use(cors());
app.use(express.json());

// Bot control variables
let botController = null;
let botsRunning = false;

// API Endpoints
app.post('/api/bots/start', async (req, res) => {
    try {
        if (botsRunning) {
            return res.status(400).json({ success: false, message: 'Bots are already running' });
        }

        botController = new FNLB();
        await botController.start({
            apiToken: process.env.FNLB_API_TOKEN || 'DGfCBefvjOU-UORpSFBh8gbArVEGkKK5xb-BB7kZk8NfEFj6hiCf8v2Nefu6',
            botsPerShard: 20
        });

        botsRunning = true;
        res.json({ success: true, message: 'Bots started successfully' });
    } catch (error) {
        console.error('Error starting bots:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/bots/stop', async (req, res) => {
    try {
        if (!botsRunning || !botController) {
            return res.status(400).json({ success: false, message: 'No bots are currently running' });
        }

        await botController.stop();
        botController = null;
        botsRunning = false;

        res.json({ success: true, message: 'Bots stopped successfully' });
    } catch (error) {
        console.error('Error stopping bots:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/bots/status', (req, res) => {
    res.json({ running: botsRunning });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Bot control API available at http://localhost:${PORT}/api/bots`);
});