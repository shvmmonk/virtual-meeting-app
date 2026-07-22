const App = (() => {
    let currentUser = { name: 'User 1', avatarConfig: null, avatarThumbnail: null };
    let participants = [];

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
        document.getElementById('lobby-avatar-circle').style.background = AvatarBuilder.getDefaultConfig().skinColor;

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

        document.getElementById('add-participant-btn').addEventListener('click', addParticipant);
        document.getElementById('leave-btn').addEventListener('click', leaveMeeting);
    }

    function updateLobbyPreview() {
        const circle = document.getElementById('lobby-avatar-circle');
        if (currentUser.avatarThumbnail) {
            circle.classList.add('avatar-img');
            circle.style.backgroundImage = `url(${currentUser.avatarThumbnail})`;
        }
    }

    function startMeeting() {
        showScreen('meeting');
        participants = [{
            name: currentUser.name,
            thumbnail: currentUser.avatarThumbnail,
            config: currentUser.avatarConfig,
            muted: false
        }];
        renderParticipants();
    }

    function renderParticipants() {
        const container = document.getElementById('meeting-container');
        container.innerHTML = '';

        participants.forEach((p, index) => {
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.dataset.index = index;

            const imgSrc = p.thumbnail || `https://ui-avatars.com/api/?name=${p.name}&background=7289da&color=fff&size=100`;

            chair.innerHTML = `
                <div class="avatar">
                    <img src="${imgSrc}" alt="${p.name}" />
                </div>
                <p class="participant-name">${p.name}</p>
                <button class="mute-btn">${p.muted ? '🔇' : '🎤'}</button>
            `;

            chair.addEventListener('click', () => {
                chair.classList.toggle('active');
            });

            const muteBtn = chair.querySelector('.mute-btn');
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                p.muted = !p.muted;
                muteBtn.textContent = p.muted ? '🔇' : '🎤';
            });

            container.appendChild(chair);
        });

        document.getElementById('participant-count').textContent = `Participants: ${participants.length}`;
    }

    function addParticipant() {
        const count = participants.length + 1;
        const randomColor = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        const randomCfg = {
            skinColor: randomColor(),
            hairStyle: ['short', 'spiky', 'curly', 'long', 'bald'][Math.floor(Math.random() * 5)],
            hairColor: randomColor(),
            eyeStyle: ['round', 'happy', 'sleepy'][Math.floor(Math.random() * 3)],
            eyeColor: randomColor(),
            outfitColor: randomColor(),
            outfitStyle: ['casual', 'formal', 'hoodie'][Math.floor(Math.random() * 3)],
            accessory: ['none', 'glasses', 'beanie', 'headphones'][Math.floor(Math.random() * 4)]
        };

        participants.push({
            name: `User ${count}`,
            thumbnail: null,
            config: randomCfg,
            muted: false
        });

        renderParticipants();
    }

    function leaveMeeting() {
        showScreen('lobby');
        participants = [];
    }

    document.addEventListener('DOMContentLoaded', init);
})();
