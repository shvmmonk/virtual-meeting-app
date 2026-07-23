const WebRTCManager = (() => {
    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    let localStream = null;
    let screenStream = null;
    let peerConnections = {};
    let localUserId = null;

    function init(userId) {
        localUserId = userId;
    }

    async function startLocalMedia(video = true, audio = true) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            return localStream;
        } catch (e) {
            return null;
        }
    }

    function getLocalStream() { return localStream; }

    function toggleVideo(on) { localStream?.getVideoTracks().forEach(t => t.enabled = on); }

    function toggleAudio(on) { localStream?.getAudioTracks().forEach(t => t.enabled = on); }

    function isAudioMuted() {
        const track = localStream?.getAudioTracks()[0];
        return track ? !track.enabled : true;
    }

    async function startScreenShare() {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            return screenStream;
        } catch (e) {
            return null;
        }
    }

    function stopScreenShare() {
        screenStream?.getTracks().forEach(t => t.stop());
        screenStream = null;
    }

    function createPC(userId, remoteVideo) {
        if (peerConnections[userId]) closePeerConnection(userId);

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnections[userId] = { pc, remoteVideo };

        localStream?.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.onicecandidate = (e) => {
            if (e.candidate) Signaling.sendIceCandidate(userId, e.candidate);
        };

        pc.ontrack = (e) => {
            if (remoteVideo) remoteVideo.srcObject = e.streams[0];
        };

        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                closePeerConnection(userId);
            }
        };

        return pc;
    }

    async function createOffer(userId, remoteVideo) {
        const pc = createPC(userId, remoteVideo);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        Signaling.sendOffer(userId, offer);
    }

    async function handleOffer(fromUserId, offer, remoteVideo) {
        const pc = createPC(fromUserId, remoteVideo);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        Signaling.sendAnswer(fromUserId, answer);
    }

    async function handleAnswer(fromUserId, answer) {
        const entry = peerConnections[fromUserId];
        if (entry && entry.pc.signalingState === 'have-local-offer') {
            await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async function handleIceCandidate(fromUserId, candidate) {
        const entry = peerConnections[fromUserId];
        if (entry && entry.pc.remoteDescription) {
            await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    function closePeerConnection(userId) {
        const entry = peerConnections[userId];
        if (entry) {
            entry.pc.close();
            delete peerConnections[userId];
        }
    }

    function closeAll() {
        Object.keys(peerConnections).forEach(closePeerConnection);
        localStream?.getTracks().forEach(t => t.stop());
        localStream = null;
        stopScreenShare();
    }

    return { init, startLocalMedia, getLocalStream, toggleVideo, toggleAudio, isAudioMuted, startScreenShare, stopScreenShare, createOffer, handleOffer, handleAnswer, handleIceCandidate, closePeerConnection, closeAll };
})();
