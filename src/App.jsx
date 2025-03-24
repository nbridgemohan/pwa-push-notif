import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [subscription, setSubscription] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [newVersion, setNewVersion] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [notificationStatus, setNotificationStatus] = useState('')

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(async reg => {
          console.log('Service Worker registered:', reg)
          setRegistration(reg)
          
          // Check for existing subscription
          try {
            const existingSub = await reg.pushManager.getSubscription()
            if (existingSub) {
              console.log('Found existing subscription:', existingSub)
              setSubscription(existingSub)
            }
          } catch (err) {
            console.error('Error checking existing subscription:', err)
          }
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    })

    // Check for updates
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/version.json')
      const data = await response.json()
      setNewVersion(data.version)
      
      // Get current version from localStorage
      const currentVersion = localStorage.getItem('appVersion')
      setCurrentVersion(currentVersion || '0.0.0')
      
      // If versions don't match and we have a service worker registration
      if (currentVersion !== data.version && registration) {
        setUpdateAvailable(true)
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  const updateApp = async () => {
    if (!registration) return

    try {
      // Send message to service worker to skip waiting
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload the page to apply the update
      window.location.reload()
    } catch (error) {
      console.error('Error updating app:', error)
    }
  }

  // Get the base URL for API calls
  const getBaseUrl = () => {
    if (import.meta.env.PROD) {
      // In production, use the Vercel URL
      return '';  // Empty string means use relative URLs
    }
    // In development, use localhost
    return 'http://localhost:3000';
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BP-HsRL6T--BxkEWQBV-Joj-tZFIVuCl95s2NMjuwOjAd0BKiFZprFgcmRR38TQysxww9RfnDsjaVIBlYMg4pmA'
      });

      console.log('Push notification subscription:', subscription);

      const response = await fetch(`${getBaseUrl()}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to store subscription on server');
      }

      setSubscription(subscription);
      console.log('Push notification subscription stored on server');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setSubscription(null);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('Requesting notification permission...')
      const permission = await Notification.requestPermission()
      console.log('Permission result:', permission)
      setNotificationPermission(permission)
      if (permission === 'granted') {
        await subscribeToPushNotifications()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      alert('Error requesting permission: ' + error.message)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const sendSampleNotification = async () => {
    try {
      if (!subscription) {
        console.error('No subscription available');
        return;
      }

      console.log('Sending notification with subscription:', subscription);

      const response = await fetch(`${getBaseUrl()}/api/send-push-msg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification: {
            title: 'Hello from PWA!',
            body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
            timestamp: Date.now()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Notification sent successfully:', result);
      setNotificationStatus('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus(`Error sending notification: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <h1>PWA Sample with Push Notifications</h1>
      
      {updateAvailable && (
        <div className="update-section">
          <h2>Update Available!</h2>
          <p>Current version: {currentVersion}</p>
          <p>New version: {newVersion}</p>
          <button 
            onClick={updateApp}
            className="update-button"
          >
            Update Now
          </button>
        </div>
      )}

      <div className="notification-section">
        <h2>Push Notification Status</h2>
        <p>Permission: {notificationPermission}</p>
        <p>Subscription: {subscription ? 'Active' : 'Not subscribed'}</p>
        {notificationPermission !== 'granted' ? (
          <button 
            onClick={requestNotificationPermission}
            className="primary-button"
          >
            Enable Notifications
          </button>
        ) : !subscription ? (
          <button 
            onClick={subscribeToPushNotifications}
            className="primary-button"
          >
            Subscribe to Notifications
          </button>
        ) : (
          <button 
            disabled
            className="primary-button"
          >
            Notifications Enabled
          </button>
        )}
      </div>

      {isInstallable && (
        <div className="install-section">
          <h2>Install App</h2>
          <button 
            onClick={handleInstallClick}
            className="install-button"
          >
            Install App
          </button>
        </div>
      )}

      {subscription && (
        <div className="test-section">
          <h2>Test Notifications</h2>
          <button 
            onClick={sendSampleNotification}
            className="test-button"
          >
            Send Sample Notification
          </button>
        </div>
      )}

      {notificationStatus && (
        <div className="notification-status">
          {notificationStatus}
        </div>
      )}
    </div>
  )
}

export default App 