const App = (() => {
    let currentUser = { name: 'User 1', avatarConfig: null, avatarThumbnail: null };
    let participants = [];
    let isInMeeting = false;
    let roomId = null;
    let userId = null;
    let isOffline = false;
    let handRaised = false;
    let chatVisible = true;

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
        document.getElementById('hand-btn').addEventListener('click', toggleHand);
        document.getElementById('chat-toggle-btn').addEventListener('click', toggleChat);
        document.getElementById('chat-send-btn').addEventListener('click', sendChatMessage);
        document.getElementById('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });
        document.getElementById('leave-btn').addEventListener('click', leaveMeeting);

        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => sendReaction(btn.dataset.emoji));
        });

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
            isOffline = false;
        } catch (e) {
            isOffline = true;
            document.getElementById('offline-badge').style.display = 'inline';
        }

        participants = [{
            id: userId,
            name: currentUser.name,
            muted: false,
            handUp: false
        }];
        renderParticipants();
    }

    function handleParticipantsUpdate(participantList) {
        participants = participantList.map(p => ({
            id: p.userId,
            name: p.userName,
            muted: false,
            handUp: false
        }));
        const me = participants.find(p => p.id === userId);
        if (!me) participants.unshift({ id: userId, name: currentUser.name, muted: false, handUp: false });
        renderParticipants();
    }

    function handlePeerJoined(data) {
        if (!participants.find(p => p.id === data.userId)) {
            participants.push({ id: data.userId, name: data.userName || 'Guest', muted: false, handUp: false });
            renderParticipants();
            setTimeout(() => WebRTCManager.createOffer(data.userId, getRemoteVideo(data.userId)), 500);
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
            if (p.handUp) chair.classList.add('hand-raised');

            const initial = p.name.charAt(0).toUpperCase();
            chair.innerHTML = `
                <div class="chair-hand-icon">✋</div>
                <div class="avatar">
                    <video autoplay playsinline muted id="remote-video-${p.id}" style="display:none;"></video>
                    <div class="avatar-placeholder" id="placeholder-${p.id}">${initial}</div>
                </div>
                <p class="participant-name">${p.name}</p>
                <button class="mute-btn">${p.muted ? '🔇' : '🎤'}</button>
            `;

            chair.addEventListener('click', () => {
                document.querySelectorAll('.chair').forEach(c => {
                    c.classList.remove('active', 'speaking');
                });
                chair.classList.add('active', 'speaking');
                setTimeout(() => chair.classList.remove('speaking'), 2000);
            });

            const muteBtn = chair.querySelector('.mute-btn');
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (p.id === userId || isOffline) {
                    p.muted = !p.muted;
                    muteBtn.textContent = p.muted ? '🔇' : '🎤';
                    if (p.id === userId) WebRTCManager.toggleAudio(!p.muted);
                    if (!isOffline) Signaling.sendMuteStatus(p.muted);
                }
            });

            container.appendChild(chair);
        });

        if (isOffline) {
            const controlsRow = document.createElement('div');
            controlsRow.className = 'offline-controls';
            controlsRow.innerHTML = `
                <button class="add-local-btn" id="offline-add-btn">+ Add Local</button>
                <button class="remove-local-btn" id="offline-remove-btn">- Remove</button>
            `;
            container.appendChild(controlsRow);
            setTimeout(() => {
                document.getElementById('offline-add-btn')?.addEventListener('click', addLocalParticipant);
                document.getElementById('offline-remove-btn')?.addEventListener('click', removeLocalParticipant);
            }, 0);
        }

        document.getElementById('participant-count').textContent = `Participants: ${participants.length}`;
    }

    function updateMuteIcon(userId, muted) {
        const chair = document.querySelector(`.chair[data-id="${userId}"]`);
        if (chair) {
            const btn = chair.querySelector('.mute-btn');
            if (btn) btn.textContent = muted ? '🔇' : '🎤';
        }
    }

    function addLocalParticipant() {
        const count = participants.length;
        const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];
        const colors = ['#f5cba7', '#d4a574', '#c68642', '#8d5524', '#e0ac69', '#f1c27d', '#ffdab9', '#dbb88c'];
        participants.push({
            id: 'local-' + Date.now() + '-' + count,
            name: `Guest ${count}`,
            muted: false,
            handUp: Math.random() > 0.7
        });
        renderParticipants();
    }

    function removeLocalParticipant() {
        const locals = participants.filter(p => p.id !== userId);
        if (locals.length > 0) {
            participants = participants.filter(p => p.id !== locals[locals.length - 1].id);
            renderParticipants();
        }
    }

    function toggleMic() {
        if (isOffline) {
            const me = participants.find(p => p.id === userId);
            if (me) { me.muted = !me.muted; renderParticipants(); }
            return;
        }
        const muted = !WebRTCManager.isAudioMuted();
        WebRTCManager.toggleAudio(muted);
        document.getElementById('mic-btn').textContent = muted ? '🔇' : '🎤';
        Signaling.sendMuteStatus(!muted);
    }

    function toggleCam() {
        if (isOffline) return;
        const video = document.getElementById('local-video');
        const on = video.hidden;
        WebRTCManager.toggleVideo(on);
        video.hidden = !on;
        document.getElementById('cam-btn').textContent = on ? '📷' : '🚫';
    }

    let isSharing = false;

    async function toggleScreenShare() {
        if (isOffline) return;
        if (isSharing) {
            WebRTCManager.stopScreenShare();
            isSharing = false;
            document.getElementById('screen-btn').textContent = '🖥️';
        } else {
            const stream = await WebRTCManager.startScreenShare();
            if (stream) { isSharing = true; document.getElementById('screen-btn').textContent = '⏹️'; }
        }
    }

    function toggleHand() {
        handRaised = !handRaised;
        document.getElementById('hand-btn').classList.toggle('hand-active', handRaised);
        document.getElementById('local-hand-indicator').classList.toggle('show', handRaised);
        if (isOffline) {
            const me = participants.find(p => p.id === userId);
            if (me) { me.handUp = handRaised; renderParticipants(); }
        }
    }

    function toggleChat() {
        chatVisible = !chatVisible;
        document.getElementById('chat-panel').classList.toggle('collapsed', !chatVisible);
    }

    function sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        addChatMessage(currentUser.name, text, true);
        if (!isOffline) {
            // In real mode would broadcast via WebSocket
        }
    }

    function addChatMessage(sender, text, isOwn) {
        const container = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = 'chat-msg ' + (isOwn ? 'own' : 'other');
        msg.innerHTML = `<div class="msg-sender">${sender}</div><div>${text}</div>`;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    function sendReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'reaction-float';
        el.textContent = emoji;
        el.style.left = (Math.random() * 60 + 20) + '%';
        el.style.bottom = '80px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    function leaveMeeting() {
        Signaling.disconnect();
        WebRTCManager.closeAll();
        participants = [];
        isInMeeting = false;
        isOffline = false;
        handRaised = false;
        document.getElementById('hand-btn').classList.remove('hand-active');
        document.getElementById('offline-badge').style.display = 'none';
        document.getElementById('local-hand-indicator').classList.remove('show');
        document.getElementById('chat-panel').classList.remove('collapsed');
        chatVisible = true;
        document.getElementById('chat-messages').innerHTML = '';
        showScreen('lobby');
    }

    document.addEventListener('DOMContentLoaded', init);
})();