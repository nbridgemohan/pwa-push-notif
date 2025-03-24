import webpush from 'web-push';

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        url: process.env.VERCEL_URL || 'http://localhost:5173',
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 