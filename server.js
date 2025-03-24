import express from 'express';
import webpush from 'web-push';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

// VAPID keys configuration
const vapidKeys = {
  publicKey: 'BP-HsRL6T--BxkEWQBV-Joj-tZFIVuCl95s2NMjuwOjAd0BKiFZprFgcmRR38TQysxww9RfnDsjaVIBlYMg4pmA',
  privateKey: 'WU-8fs510oIHIO4cGW-4jDCaoQqLK0bdK3TYOI1f3_M'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Create HTTPS agent with the certificate
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Only for development
  cert: fs.readFileSync('c:/Apps/node-cert-parser/cert.crt')
});

// Store subscriptions (in memory for demo purposes)
let subscriptions = new Set();

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  console.log('Received subscription:', subscription);
  
  subscriptions.add(JSON.stringify(subscription));
  
  res.status(201).json({ message: 'Subscription added successfully' });
});

app.post('/api/send-push-msg', async (req, res) => {
  try {
    const { subscription, notification } = req.body;
    console.log('Sending notification:', notification);
    console.log('To subscription:', subscription);

    if (!subscription) {
      throw new Error('No subscription provided');
    }

    const payload = JSON.stringify({
      title: notification.title || 'New Notification',
      body: notification.body || 'Hello from the server!',
      timestamp: notification.timestamp || Date.now(),
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      requireInteraction: true,
      data: {
        dateOfArrival: Date.now(),
        url: 'http://localhost:5173', // Update this with your Vite dev server port
        primaryKey: Date.now()
      }
    });

    console.log('Sending payload:', payload);

    const options = {
      TTL: 60,
      vapidDetails: {
        subject: 'mailto:your-email@example.com',
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
      },
      headers: {},
      agent: httpsAgent,
      urgency: 'high',
      topic: 'pwa-notification'
    };

    await webpush.sendNotification(subscription, payload, options);
    console.log('Push notification sent successfully');
    res.status(200).json({ 
      message: 'Notification sent successfully',
      payload: JSON.parse(payload)
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({
      message: 'Failed to send push notification',
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 