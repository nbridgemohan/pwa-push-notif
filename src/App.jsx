import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [subscription, setSubscription] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState('default')

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration)
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BE5hE0Q64IBAG69hORTUbXto1N4v5A65EAzso8hz03EkksBbpF9rvkJTPvIUhqmoL05gXtVKLAUvuDJ4v8-wMZs' // Replace with your VAPID public key
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

  return (
    <div className="app">
      <h1>PWA Sample with Push Notifications</h1>
      <div className="notification-section">
        <h2>Push Notification Status</h2>
        <p>Permission: {notificationPermission}</p>
        <p>Subscription: {subscription ? 'Active' : 'Not subscribed'}</p>
        <button 
          onClick={requestNotificationPermission}
          disabled={notificationPermission === 'granted'}
        >
          {notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
        </button>
      </div>
    </div>
  )
}

export default App 