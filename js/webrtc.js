// WebRTC Logic (Phase 3)
document.addEventListener('gatewayUnlocked', async () => {
    if (window.location.pathname.includes('video.html')) {
        const localVideo = document.getElementById('local-video');
        const remoteVideo = document.getElementById('remote-video');
        const cameraBlocked = document.getElementById('camera-blocked');
        const videoContainer = document.getElementById('video-container');

        let localStream;
        let peerConnection;
        
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const channel = supabase.channel('webrtc_room');

        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
        } catch (err) {
            console.error('Camera access denied:', err);
            cameraBlocked.classList.remove('hidden');
            videoContainer.classList.add('hidden');
            return;
        }

        peerConnection = new RTCPeerConnection(configuration);
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'candidate',
                    payload: { candidate: event.candidate }
                });
            }
        };

        channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            channel.send({
                type: 'broadcast',
                event: 'answer',
                payload: { answer }
            });
        });

        channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
        });

        channel.on('broadcast', { event: 'candidate' }, async ({ payload }) => {
            await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
        });

        channel.on('presence', { event: 'join' }, async () => {
            // Trigger push notification to wake up other peers
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'NOTIFY_JOIN' });
            }

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { offer }
            });
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ user: 'peer_' + Math.random().toString(36).substr(2, 9) });
            }
        });
    }
});
