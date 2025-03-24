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

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered:', reg)
          setRegistration(reg)
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

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BP-HsRL6T--BxkEWQBV-Joj-tZFIVuCl95s2NMjuwOjAd0BKiFZprFgcmRR38TQysxww9RfnDsjaVIBlYMg4pmA'
      })
      setSubscription(subscription)
      console.log('Push notification subscription:', subscription)
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
    }
  }

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        await subscribeToPushNotifications()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
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
    if (!subscription) {
      alert('Please enable notifications first!')
      return
    }

    try {
      const response = await fetch('https://web-push-codelab.glitch.me/api/send-push-msg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          message: 'This is a sample push notification!',
          title: 'PWA Sample Notification'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }

      alert('Notification sent successfully!')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification. Check console for details.')
    }
  }

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
        <button 
          onClick={requestNotificationPermission}
          disabled={notificationPermission === 'granted'}
          className="primary-button"
        >
          {notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
        </button>
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
    </div>
  )
}

export default App 