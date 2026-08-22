// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: 'staysetu-1bf2f',
  appId: '1:736756765234:web:3860429390129871dbe22b',
  storageBucket: 'staysetu-1bf2f.firebasestorage.app',
  apiKey: 'AIzaSyAnrjrrk7X3E2tl8uqsMKealMKE5L0Ty9M',
  authDomain: 'staysetu-1bf2f.firebaseapp.com',
  messagingSenderId: '736756765234',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'PG-SETU Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update from PG-SETU.',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
