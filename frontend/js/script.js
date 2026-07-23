const App = (() => {
    let currentUser = { name: 'User 1', avatarConfig: null, avatarThumbnail: null };
    let participants = [];
    let isInMeeting = false;
    let roomId = null;
    let userId = null;

    const SIGNALING_URL = 'ws://localhost:8080/ws';

    const screens = {
        lobby: document.getElementById('lobby-screen'),
        builder: document.getElementById('builder-screen'),
        meeting: document.getElementById('meeting-screen')
    };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.style.display = 'none');
        screens[name].style.display = 'flex';
    }

    function init() {
        showScreen('lobby');

        const defaultCfg = AvatarBuilder.getDefaultConfig();
        currentUser.avatarConfig = defaultCfg;
        document.getElementById('lobby-avatar-circle').style.background = defaultCfg.skinColor;

        document.getElementById('username-input').addEventListener('input', (e) => {
            currentUser.name = e.target.value || 'User 1';
        });

        document.getElementById('customize-btn').addEventListener('click', () => {
            showScreen('builder');
            AvatarBuilder.setupBuilder();
        });

        document.getElementById('save-avatar-btn').addEventListener('click', () => {
            currentUser.avatarConfig = AvatarBuilder.getConfig();
            currentUser.avatarThumbnail = AvatarBuilder.captureThumbnail();
            updateLobbyPreview();
            showScreen('lobby');
        });

        document.getElementById('join-meeting-btn').addEventListener('click', () => {
            if (!currentUser.avatarThumbnail) {
                showScreen('builder');
                return;
            }
            startMeeting();
        });

        document.getElementById('mic-btn').addEventListener('click', toggleMic);
        document.getElementById('cam-btn').addEventListener('click', toggleCam);
        document.getElementById('screen-btn').addEventListener('click', toggleScreenShare);
        document.getElementById('leave-btn').addEventListener('click', leaveMeeting);

        Signaling.setHandlers({
            getUserName: () => currentUser.name,
            onParticipantsUpdate: handleParticipantsUpdate,
            onPeerJoined: handlePeerJoined,
            onPeerLeft: handlePeerLeft,
            onOffer: handleOffer,
            onAnswer: handleAnswer,
            onIceCandidate: handleIceCandidate,
            onPeerMute: handlePeerMute
        });
    }

    function updateLobbyPreview() {
        const circle = document.getElementById('lobby-avatar-circle');
        if (currentUser.avatarThumbnail) {
            circle.classList.add('avatar-img');
            circle.style.backgroundImage = `url(${currentUser.avatarThumbnail})`;
        }
    }

    async function startMeeting() {
        roomId = 'room-' + Date.now();
        userId = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

        showScreen('meeting');
        document.getElementById('room-id-display').textContent = 'Room: ' + roomId;
        document.getElementById('local-avatar-circle').style.backgroundImage = `url(${currentUser.avatarThumbnail})`;
        document.getElementById('local-avatar-circle').style.backgroundSize = 'cover';
        document.getElementById('local-avatar-circle').style.backgroundPosition = 'center';

        WebRTCManager.init(userId);
        const stream = await WebRTCManager.startLocalMedia(true, true);
        if (stream) {
            document.getElementById('local-video').srcObject = stream;
            document.getElementById('local-video').hidden = false;
        }

        try {
            await Signaling.connect(SIGNALING_URL, roomId, userId);
        } catch (e) {
            renderParticipants();
        }
    }

    function handleParticipantsUpdate(participantList) {
        participants = participantList.map(p => ({
            id: p.userId,
            name: p.userName,
            muted: false,
            videoMuted: false
        }));
        renderParticipants();
    }

    function handlePeerJoined(data) {
        const exists = participants.find(p => p.id === data.userId);
        if (!exists) {
            participants.push({
                id: data.userId,
                name: data.userName || 'Guest',
                muted: false,
                videoMuted: false
            });
            renderParticipants();
            setTimeout(() => {
                WebRTCManager.createOffer(data.userId, getRemoteVideo(data.userId));
            }, 500);
        }
    }

    function handlePeerLeft(data) {
        participants = participants.filter(p => p.id !== data.userId);
        WebRTCManager.closePeerConnection(data.userId);
        renderParticipants();
    }

    function handleOffer(data) {
        WebRTCManager.handleOffer(data.fromUserId, data.offer, getRemoteVideo(data.fromUserId));
    }

    function handleAnswer(data) {
        WebRTCManager.handleAnswer(data.fromUserId, data.answer);
    }

    function handleIceCandidate(data) {
        WebRTCManager.handleIceCandidate(data.fromUserId, data.candidate);
    }

    function handlePeerMute(data) {
        const p = participants.find(x => x.id === data.userId);
        if (p) p.muted = data.muted;
        updateMuteIcon(data.userId, data.muted);
    }

    function getRemoteVideo(userId) {
        const chair = document.querySelector(`.chair[data-id="${userId}"]`);
        return chair ? chair.querySelector('video') : null;
    }

    function renderParticipants() {
        const container = document.getElementById('meeting-container');
        container.innerHTML = '';

        participants.forEach(p => {
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.dataset.id = p.id;

            chair.innerHTML = `
                <div class="avatar">
                    <video autoplay playsinline muted id="remote-video-${p.id}"></video>
                    <div class="avatar-placeholder" id="placeholder-${p.id}">${p.name.charAt(0).toUpperCase()}</div>
                </div>
                <p class="participant-name">${p.name}</p>
                <button class="mute-btn">${p.muted ? '🔇' : '🎤'}</button>
            `;

            chair.addEventListener('click', () => {
                document.querySelectorAll('.chair').forEach(c => c.classList.remove('active'));
                chair.classList.add('active');
            });

            container.appendChild(chair);
        });

        document.getElementById('participant-count').textContent = `Participants: ${participants.length}`;
    }

    function updateMuteIcon(userId, muted) {
        const chair = document.querySelector(`.chair[data-id="${userId}"]`);
        if (chair) {
            const btn = chair.querySelector('.mute-btn');
            if (btn) btn.textContent = muted ? '🔇' : '🎤';
        }
    }

    function toggleMic() {
        const muted = !WebRTCManager.isAudioMuted();
        WebRTCManager.toggleAudio(muted);
        document.getElementById('mic-btn').textContent = muted ? '🔇' : '🎤';
        Signaling.sendMuteStatus(!muted);
    }

    function toggleCam() {
        const video = document.getElementById('local-video');
        const on = video.hidden;
        WebRTCManager.toggleVideo(on);
        video.hidden = !on;
        document.getElementById('cam-btn').textContent = on ? '📷' : '🚫';
    }

    let isSharing = false;

    async function toggleScreenShare() {
        if (isSharing) {
            WebRTCManager.stopScreenShare();
            isSharing = false;
            document.getElementById('screen-btn').textContent = '🖥️';
        } else {
            const stream = await WebRTCManager.startScreenShare();
            if (stream) {
                isSharing = true;
                document.getElementById('screen-btn').textContent = '⏹️';
            }
        }
    }

    function leaveMeeting() {
        Signaling.disconnect();
        WebRTCManager.closeAll();
        participants = [];
        isInMeeting = false;
        showScreen('lobby');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
