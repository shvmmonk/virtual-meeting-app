const MeetingScene = (() => {
    let scene, camera, renderer, controls;
    let chairMeshes = {};
    let avatarSprites = {};
    let selectedChair = null;
    let roomContainer;

    const canvas = document.getElementById('meeting-canvas');

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1c20);
        scene.fog = new THREE.Fog(0x1a1c20, 12, 20);

        camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
        camera.position.set(0, 4, 7);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        roomContainer = new THREE.Group();
        scene.add(roomContainer);

        buildRoom();
        buildLights();

        animate();

        window.addEventListener('resize', () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
    }

    function buildLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffeedd, 1.2);
        key.position.set(3, 6, 4);
        key.castShadow = true;
        key.shadow.mapSize.width = 1024;
        key.shadow.mapSize.height = 1024;
        scene.add(key);

        const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
        fill.position.set(-3, 2, -2);
        scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.3);
        rim.position.set(0, 1, -5);
        scene.add(rim);

        const point = new THREE.PointLight(0x43b581, 0.5, 8);
        point.position.set(0, 3, 0);
        scene.add(point);
    }

    function buildRoom() {
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x2a2d34,
            roughness: 0.7,
            metalness: 0.1
        });

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.3;
        floor.receiveShadow = true;
        roomContainer.add(floor);

        const gridHelper = new THREE.GridHelper(14, 20, 0x444466, 0x333355);
        gridHelper.position.y = -0.25;
        roomContainer.add(gridHelper);

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x22252a,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
        backWall.position.set(0, 2.2, -5.5);
        roomContainer.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), wallMat);
        leftWall.position.set(-6.5, 2.2, 0);
        leftWall.rotation.y = Math.PI / 2;
        roomContainer.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), wallMat);
        rightWall.position.set(6.5, 2.2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        roomContainer.add(rightWall);

        const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1, side: THREE.DoubleSide });
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), ceilMat);
        ceil.position.y = 4.5;
        ceil.rotation.x = Math.PI / 2;
        roomContainer.add(ceil);

        const accentMat = new THREE.MeshStandardMaterial({ color: 0x43b581, emissive: 0x43b581, emissiveIntensity: 0.1 });
        const baseboard = new THREE.Mesh(new THREE.BoxGeometry(12, 0.08, 0.3), accentMat);
        baseboard.position.set(0, 0.1, -5.4);
        roomContainer.add(baseboard);

        const logoMat = new THREE.MeshStandardMaterial({ color: 0x43b581, emissive: 0x43b581, emissiveIntensity: 0.2 });
        const logo = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 12, 24), logoMat);
        logo.position.set(0, 2.5, -5.3);
        roomContainer.add(logo);

        const logoLine = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.05), logoMat);
        logoLine.position.set(0, 2.0, -5.3);
        roomContainer.add(logoLine);
    }

    function build3DChair(group, x, z, label) {
        const chairGroup = new THREE.Group();

        const seatMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.6, metalness: 0.1 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), seatMat);
        seat.position.y = 0.1;
        seat.castShadow = true;
        chairGroup.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.06), seatMat);
        back.position.set(0, 0.3, -0.28);
        chairGroup.add(back);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.3, roughness: 0.5 });
        const legPositions = [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]];
        legPositions.forEach(([dx, dz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 6), legMat);
            leg.position.set(dx, -0.05, dz);
            chairGroup.add(leg);
        });

        const glowRing = new THREE.Mesh(
            new THREE.RingGeometry(0.32, 0.36, 24),
            new THREE.MeshBasicMaterial({ color: 0x43b581, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        glowRing.rotation.x = -Math.PI / 2;
        glowRing.position.y = 0.15;
        glowRing.name = 'glow';
        chairGroup.add(glowRing);

        chairGroup.position.set(x, -0.15, z);
        group.add(chairGroup);
        return chairGroup;
    }

    function arrangeChairs(participantCount) {
        while (roomContainer.children.length > 5) {
            roomContainer.remove(roomContainer.children[roomContainer.children.length - 1]);
        }

        chairMeshes = {};
        avatarSprites = {};

        const radius = 2.2;
        const count = Math.max(participantCount, 1);
        const angleStep = Math.PI / Math.max(count, 2);

        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + angleStep * (i + 1) - (count > 1 ? angleStep * 0.5 : 0);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius + 1.2;

            const chair = build3DChair(roomContainer, x, z, `P${i + 1}`);
            chair.userData.index = i;
            chair.userData.defaultPos = { x, z };
            chairMeshes[i] = chair;

            const spriteMap = new THREE.CanvasTexture(generateAvatarCanvas('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')));
            const spriteMat = new THREE.SpriteMaterial({ map: spriteMap, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.5, 0.5, 1);
            sprite.position.set(x, 0.8, z);
            roomContainer.add(sprite);
            avatarSprites[i] = sprite;
        }
    }

    function generateAvatarCanvas(color) {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('😊', 32, 34);
        return c;
    }

    function updateAvatars(participants) {
        const count = participants.length;
        const radius = 2.2;
        const angleStep = Math.PI / Math.max(count, 2);

        participants.forEach((p, i) => {
            const angle = -Math.PI / 2 + angleStep * (i + 1) - (count > 1 ? angleStep * 0.5 : 0);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius + 1.2;

            if (!chairMeshes[i]) {
                const chair = build3DChair(roomContainer, x, z, p.name);
                chair.userData.index = i;
                chairMeshes[i] = chair;
            } else {
                chairMeshes[i].position.set(x, -0.15, z);
            }

            if (p.thumbnail) {
                const img = new Image();
                img.onload = () => {
                    const map = new THREE.CanvasTexture(img);
                    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false });
                    if (avatarSprites[i]) {
                        avatarSprites[i].material.map = map;
                        avatarSprites[i].material.needsUpdate = true;
                    }
                };
                img.src = p.thumbnail;
            }

            if (!avatarSprites[i]) {
                const color = p.color || '#7289da';
                const map = new THREE.CanvasTexture(generateAvatarCanvas(color));
                const mat = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false });
                const sprite = new THREE.Sprite(mat);
                sprite.scale.set(0.5, 0.5, 1);
                sprite.position.set(x, 0.8, z);
                roomContainer.add(sprite);
                avatarSprites[i] = sprite;
            } else {
                avatarSprites[i].position.set(x, 0.8, z);
            }
        });

        for (let i = count; i < Object.keys(chairMeshes).length; i++) {
            if (chairMeshes[i]) {
                roomContainer.remove(chairMeshes[i]);
                delete chairMeshes[i];
            }
            if (avatarSprites[i]) {
                roomContainer.remove(avatarSprites[i]);
                delete avatarSprites[i];
            }
        }
    }

    function highlightChair(index) {
        Object.values(chairMeshes).forEach(chair => {
            const glow = chair.getObjectByName('glow');
            if (glow) glow.material.opacity = 0;
        });

        const chair = chairMeshes[index];
        if (chair) {
            const glow = chair.getObjectByName('glow');
            if (glow) glow.material.opacity = 0.6;
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        if (roomContainer) {
            roomContainer.rotation.y += 0.001;
            Object.values(avatarSprites).forEach(s => {
                if (s) s.lookAt(camera.position);
            });
        }
        renderer.render(scene, camera);
    }

    function setSize(w, h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    return { init, arrangeChairs, updateAvatars, highlightChair, setSize };
})();
