const App = (() => {
    let currentUser = { name: 'User 1', avatarConfig: null, avatarThumbnail: null };
    let participants = [];
    let isInMeeting = false;
    let roomId = null;
    let userId = null;
    let isOffline = false;
    let handRaised = false;
    let chatVisible = true;
    let gridView = false;
    let cafeView = false;
    let msgCount = 0;

    const SIGNALING_URL = 'ws://localhost:8080/ws';

    const screens = {
        lobby: document.getElementById('lobby-screen'),
        builder: document.getElementById('builder-screen'),
        meeting: document.getElementById('meeting-screen')
    };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    function toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = message;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.08;
            if (type === 'join') { osc.frequency.value = 800; osc.start(); setTimeout(() => { osc.frequency.value = 1000; setTimeout(() => { osc.stop(); ctx.close(); }, 80); }, 80); }
            else if (type === 'leave') { osc.frequency.value = 600; osc.start(); setTimeout(() => { osc.frequency.value = 400; setTimeout(() => { osc.stop(); ctx.close(); }, 100); }, 100); }
            else if (type === 'mute') { osc.frequency.value = 500; osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 60); }
            else if (type === 'reaction') { osc.frequency.value = 900; osc.start(); setTimeout(() => { osc.frequency.value = 1200; setTimeout(() => { osc.stop(); ctx.close(); }, 60); }, 60); }
            else if (type === 'chat') { osc.frequency.value = 600; osc.type = 'sine'; osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 80); }
        } catch (e) {}
    }

    function init() {
        showScreen('lobby');

        const dc = AvatarBuilder.getDefaultConfig();
        currentUser.avatarConfig = dc;
        document.getElementById('lobby-avatar-circle').style.background = dc.skinColor;

        document.getElementById('username-input').addEventListener('input', (e) => {
            currentUser.name = e.target.value || 'User 1';
        });

        document.getElementById('customize-btn').addEventListener('click', () => {
            showScreen('builder');
            AvatarBuilder.setupBuilder();
        });

        document.getElementById('randomize-btn').addEventListener('click', () => {
            const r = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
            const hs = ['short', 'spiky', 'curly', 'long', 'bald'];
            const es = ['round', 'happy', 'sleepy'];
            const os = ['casual', 'formal', 'hoodie'];
            const ac = ['none', 'glasses', 'beanie', 'headphones'];

            document.getElementById('skin-color').value = r();
            document.getElementById('hair-style').value = hs[Math.floor(Math.random() * hs.length)];
            document.getElementById('hair-color').value = r();
            document.getElementById('eye-style').value = es[Math.floor(Math.random() * es.length)];
            document.getElementById('eye-color').value = r();
            document.getElementById('outfit-color').value = r();
            document.getElementById('outfit-style').value = os[Math.floor(Math.random() * os.length)];
            document.getElementById('accessory').value = ac[Math.floor(Math.random() * ac.length)];

            document.querySelectorAll('#skin-color, #hair-color, #eye-color, #outfit-color').forEach(el => el.dispatchEvent(new Event('input')));
            document.querySelectorAll('#hair-style, #eye-style, #outfit-style, #accessory').forEach(el => el.dispatchEvent(new Event('change')));
            toast('Randomized!', 'info');
        });

        document.getElementById('save-avatar-btn').addEventListener('click', () => {
            currentUser.avatarConfig = AvatarBuilder.getConfig();
            currentUser.avatarThumbnail = AvatarBuilder.captureThumbnail();
            updateLobbyPreview();
            showScreen('lobby');
            toast('Avatar saved!', 'success');
        });

        document.getElementById('join-meeting-btn').addEventListener('click', () => {
            if (!currentUser.avatarThumbnail) { showScreen('builder'); return; }
            startMeeting();
        });

        const setupBtn = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };

        setupBtn('mic-btn', toggleMic);
        setupBtn('cam-btn', toggleCam);
        setupBtn('screen-btn', toggleScreenShare);
        setupBtn('hand-btn', toggleHand);
        setupBtn('chat-toggle-btn', toggleChat);
        setupBtn('grid-toggle-btn', toggleGrid);
        setupBtn('cafe-toggle-btn', toggleCafeView);
        setupBtn('chat-send-btn', sendChatMessage);
        setupBtn('leave-btn', leaveMeeting);
        setupBtn('copy-invite-btn', copyInvite);
        setupBtn('close-invite-btn', () => document.getElementById('invite-modal').classList.remove('show'));

        document.getElementById('chat-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sendReaction(btn.dataset.emoji);
                playSound('reaction');
            });
        });

        document.getElementById('room-id-display')?.addEventListener('click', showInvite);

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
        const c = document.getElementById('lobby-avatar-circle');
        if (currentUser.avatarThumbnail) {
            c.classList.add('has-img');
            c.style.backgroundImage = `url(${currentUser.avatarThumbnail})`;
        }
    }

    async function startMeeting() {
        roomId = 'room-' + Date.now();
        userId = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

        showScreen('meeting');
        document.getElementById('room-id-display').innerHTML = `📋 ${roomId}`;
        const lc = document.getElementById('local-avatar-circle');
        lc.style.backgroundImage = `url(${currentUser.avatarThumbnail})`;
        lc.style.backgroundSize = 'cover';
        lc.style.backgroundPosition = 'center';
        lc.style.borderRadius = '50%';

        WebRTCManager.init(userId);
        const stream = await WebRTCManager.startLocalMedia(true, true);
        if (stream) {
            document.getElementById('local-video').srcObject = stream;
            document.getElementById('local-video').hidden = false;
        }

        MeetingScene.init();
        MeetingScene.initWalkers(3);
        CafeView.init(document.getElementById('cafe-view'), userId);
        CafeView.setLocalUserId(userId);
        CafeView.setThumbnail(currentUser.avatarThumbnail);

        participants = [{ id: userId, name: currentUser.name, muted: false, handUp: false, speaking: false, thumbnail: currentUser.avatarThumbnail }];
        MeetingScene.updateAvatars(participants);
        renderGrid();
        // Auto-show cafe view
        document.getElementById('cafe-view').classList.remove('hidden');
        document.getElementById('cafe-toggle-btn').classList.add('active-btn');
        cafeView = true;
        CafeView.setActive(true);

        try {
            await Signaling.connect(SIGNALING_URL, roomId, userId);
            isOffline = false;
            toast('Connected to signaling server', 'success');
        } catch (e) {
            isOffline = true;
            document.getElementById('offline-badge').style.display = 'inline';
            toast('Running in offline mode', 'info');
        }
        renderParticipants();
    }

    function handleParticipantsUpdate(list) {
        participants = list.map(p => ({ id: p.userId, name: p.userName, muted: false, handUp: false, speaking: false, thumbnail: null }));
        const me = participants.find(p => p.id === userId);
        if (me) me.thumbnail = currentUser.avatarThumbnail;
        renderParticipants();
    }

    function handlePeerJoined(data) {
        if (!participants.find(p => p.id === data.userId)) {
            participants.push({ id: data.userId, name: data.userName || 'Guest', muted: false, handUp: false, speaking: false, thumbnail: null });
            renderParticipants();
            toast(`${data.userName || 'Someone'} joined`, 'success');
            playSound('join');
            setTimeout(() => WebRTCManager.createOffer(data.userId, null), 500);
        }
    }

    function handlePeerLeft(data) {
        const p = participants.find(x => x.id === data.userId);
        participants = participants.filter(x => x.id !== data.userId);
        WebRTCManager.closePeerConnection(data.userId);
        renderParticipants();
        if (p) { toast(`${p.name} left`, 'info'); playSound('leave'); }
    }

    function handleOffer(data) { WebRTCManager.handleOffer(data.fromUserId, data.offer, null); }
    function handleAnswer(data) { WebRTCManager.handleAnswer(data.fromUserId, data.answer); }
    function handleIceCandidate(data) { WebRTCManager.handleIceCandidate(data.fromUserId, data.candidate); }

    function handlePeerMute(data) {
        const p = participants.find(x => x.id === data.userId);
        if (p) p.muted = data.muted;
    }

    function renderParticipants() {
        MeetingScene.updateAvatars(participants);
        renderGrid();
        CafeView.updateParticipants(participants);
        if (isOffline) createOfflineControls();
        document.getElementById('participant-count').textContent = `Participants: ${participants.length}`;
    }

    function renderGrid() {
        const grid = document.getElementById('grid-view');
        grid.innerHTML = '';
        participants.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'grid-chair';
            if (p.speaking) card.classList.add('speaking');
            if (p.handUp) card.classList.add('hand-raised');

            const initial = p.name.charAt(0).toUpperCase();
            const img = p.thumbnail ? `<img src="${p.thumbnail}" alt="${p.name}" />` : `<div class="initial">${initial}</div>`;

            card.innerHTML = `
                <div class="avatar">${img}</div>
                <div class="name">${p.name}</div>
                <div class="status">${p.muted ? '🔇' : '🎤'}</div>
                <div class="hand-icon">✋</div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.grid-chair').forEach(c => c.classList.remove('speaking'));
                card.classList.add('speaking');
                MeetingScene.highlightSpeaker(i);
            });
            grid.appendChild(card);
        });
    }

    function createOfflineControls() {
        let row = document.getElementById('offline-controls-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'offline-controls-row';
            row.innerHTML = `
                <button class="btn btn-secondary btn-sm" id="offline-add-btn">+ Add</button>
                <button class="btn btn-danger btn-sm" id="offline-remove-btn">- Remove</button>
            `;
            document.querySelector('.meeting-overlay').appendChild(row);
            document.getElementById('offline-add-btn').onclick = addLocalParticipant;
            document.getElementById('offline-remove-btn').onclick = removeLocalParticipant;
        }
    }

    function addLocalParticipant() {
        const count = participants.length;
        participants.push({ id: 'local-' + Date.now() + '-' + count, name: `Guest ${count}`, muted: Math.random() > 0.7, handUp: Math.random() > 0.8, speaking: false, thumbnail: null });
        renderParticipants();
        toast('Guest joined', 'success');
        playSound('join');
    }

    function removeLocalParticipant() {
        const locals = participants.filter(p => p.id !== userId);
        if (locals.length > 0) {
            const removed = locals[locals.length - 1];
            participants = participants.filter(p => p.id !== removed.id);
            renderParticipants();
            toast(`${removed.name} left`, 'info');
            playSound('leave');
        }
    }

    function toggleMic() {
        if (isOffline) {
            const me = participants.find(p => p.id === userId);
            if (me) { me.muted = !me.muted; renderParticipants(); }
            document.getElementById('mic-btn').classList.toggle('active-btn', isOffline ? participants.find(p => p.id === userId)?.muted : false);
            return;
        }
        const muted = !WebRTCManager.isAudioMuted();
        WebRTCManager.toggleAudio(muted);
        document.getElementById('mic-btn').textContent = muted ? '🔇' : '🎤';
        document.getElementById('mic-btn').classList.toggle('active-btn', muted);
        Signaling.sendMuteStatus(!muted);
        playSound('mute');
    }

    function toggleCam() {
        if (isOffline) return;
        const v = document.getElementById('local-video');
        const on = v.hidden;
        WebRTCManager.toggleVideo(on);
        v.hidden = !on;
        document.getElementById('cam-btn').classList.toggle('active-btn', !on);
    }

    let isSharing = false;
    async function toggleScreenShare() {
        if (isSharing) {
            if (WebRTCManager.stopScreenShare) WebRTCManager.stopScreenShare();
            isSharing = false;
            document.getElementById('screen-btn').textContent = '🖥';
            document.getElementById('screen-btn').classList.remove('active-btn');
            MeetingScene.setScreenShareStream(null);
        } else {
            const s = await WebRTCManager.startScreenShare();
            if (s) {
                isSharing = true;
                document.getElementById('screen-btn').textContent = '🖥';
                document.getElementById('screen-btn').classList.add('active-btn');
                MeetingScene.setScreenShareStream(s);
            }
        }
        if (isOffline) {
            if (isSharing) {
                isSharing = false;
                document.getElementById('screen-btn').textContent = '🖥';
                document.getElementById('screen-btn').classList.remove('active-btn');
                MeetingScene.setScreenShareStream(null);
            } else {
                const canvas = document.createElement('canvas');
                canvas.width = 640; canvas.height = 360;
                const ctx = canvas.getContext('2d');
                const draw = () => {
                    ctx.fillStyle = '#1a2744';
                    ctx.fillRect(0, 0, 640, 360);
                    ctx.fillStyle = '#4a7aff';
                    ctx.font = 'bold 32px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('📄 Screen Share', 320, 140);
                    ctx.font = '16px sans-serif';
                    ctx.fillStyle = '#ffffff88';
                    ctx.fillText('(Preview Mode)', 320, 190);
                    requestAnimationFrame(draw);
                };
                draw();
                const stream = canvas.captureStream(30);
                isSharing = true;
                document.getElementById('screen-btn').textContent = '🖥';
                document.getElementById('screen-btn').classList.add('active-btn');
                MeetingScene.setScreenShareStream(stream);
            }
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

    function toggleGrid() {
        gridView = !gridView;
        document.getElementById('grid-view').classList.toggle('hidden', !gridView);
        document.getElementById('grid-toggle-btn').classList.toggle('active-btn', gridView);
    }

    function toggleCafeView() {
        cafeView = !cafeView;
        document.getElementById('cafe-view').classList.toggle('hidden', !cafeView);
        document.getElementById('cafe-toggle-btn').classList.toggle('active-btn', cafeView);
        CafeView.setActive(cafeView);
    }

    function sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        addChatMessage(currentUser.name, text, true);
        playSound('chat');
        toast('Message sent', 'info');
    }

    function addChatMessage(sender, text, isOwn) {
        const c = document.getElementById('chat-messages');
        const m = document.createElement('div');
        m.className = 'chat-msg ' + (isOwn ? 'own' : 'other');
        m.innerHTML = `<div class="msg-sender">${sender}</div><div>${text}</div>`;
        c.appendChild(m);
        c.scrollTop = c.scrollHeight;
        document.getElementById('chat-count').textContent = `${++msgCount} messages`;
    }

    function sendReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'reaction-float';
        el.textContent = emoji;
        el.style.left = (Math.random() * 60 + 20) + '%';
        el.style.bottom = '100px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    function showInvite() {
        const input = document.getElementById('invite-link-input');
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        input.value = url;
        document.getElementById('invite-modal').classList.add('show');
    }

    function copyInvite() {
        const input = document.getElementById('invite-link-input');
        input.select();
        navigator.clipboard.writeText(input.value);
        toast('Link copied!', 'success');
    }

    function leaveMeeting() {
        Signaling.disconnect();
        WebRTCManager.closeAll();
        participants = [];
        isInMeeting = false;
        isOffline = false;
        handRaised = false;
        gridView = false;
        cafeView = false;
        document.getElementById('hand-btn').classList.remove('hand-active');
        document.getElementById('offline-badge').style.display = 'none';
        document.getElementById('local-hand-indicator').classList.remove('show');
        document.getElementById('chat-panel').classList.remove('collapsed');
        chatVisible = true;
        document.getElementById('grid-view').classList.add('hidden');
        document.getElementById('cafe-view').classList.add('hidden');
        document.getElementById('cafe-toggle-btn').classList.remove('active-btn');
        document.getElementById('chat-messages').innerHTML = '';
        msgCount = 0;
        const row = document.getElementById('offline-controls-row');
        if (row) row.remove();
        CafeView.reset();
        showScreen('lobby');
        toast('Left the meeting', 'info');
    }

    document.addEventListener('DOMContentLoaded', init);
})();