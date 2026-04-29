self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFY_JOIN') {
        self.registration.showNotification('Incoming Call', {
            body: 'Someone joined the video portal.',
            icon: '/icon.png', // Assuming an icon exists, or fallback to default
            vibrate: [200, 100, 200],
            tag: 'webrtc-call'
        });
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes('/video.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/video.html');
            }
        })
    );
});
