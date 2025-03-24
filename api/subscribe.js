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
    const subscription = req.body;
    console.log('Received subscription:', subscription);
    
    // In a production environment, you would want to store this in a database
    // For Vercel, you might want to use solutions like MongoDB Atlas, Fauna, etc.
    
    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
} 