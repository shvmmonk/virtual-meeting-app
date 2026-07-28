const MeetingScene = (() => {
    let scene, camera, renderer;
    let roomContainer;
    let chairMeshes = {};
    let avatarSprites = {};
    let particles;

    const canvas = document.getElementById('meeting-canvas');

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0e12);
        scene.fog = new THREE.FogExp2(0x0d0e12, 0.025);

        camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
        camera.position.set(0, 3.5, 6);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        roomContainer = new THREE.Group();
        scene.add(roomContainer);

        buildLights();
        buildRoom();
        buildParticles();

        window.addEventListener('resize', () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });

        animate();
    }

    function buildLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffeedd, 1.0);
        key.position.set(4, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.width = 1024;
        key.shadow.mapSize.height = 1024;
        scene.add(key);

        const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
        fill.position.set(-4, 3, -3);
        scene.add(fill);

        const rim = new THREE.PointLight(0x43b581, 0.4, 10);
        rim.position.set(0, 2, -4);
        scene.add(rim);
    }

    function buildRoom() {
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1c23, roughness: 0.8, metalness: 0.1 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.3;
        floor.receiveShadow = true;
        roomContainer.add(floor);

        const gridHelper = new THREE.GridHelper(16, 24, 0x2a2d35, 0x1e2028);
        gridHelper.position.y = -0.25;
        roomContainer.add(gridHelper);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
        const walls = [
            { pos: [0, 2.2, -6.5], rot: 0, size: [16, 5] },
            { pos: [-7.5, 2.2, 0], rot: Math.PI / 2, size: [14, 5] },
            { pos: [7.5, 2.2, 0], rot: -Math.PI / 2, size: [14, 5] }
        ];
        walls.forEach(w => {
            const wall = new THREE.Mesh(new THREE.PlaneGeometry(w.size[0], w.size[1]), wallMat);
            wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
            wall.rotation.y = w.rot;
            roomContainer.add(wall);
        });

        const glowStripMat = new THREE.MeshStandardMaterial({ color: 0x43b581, emissive: 0x43b581, emissiveIntensity: 0.15 });
        const strip = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 0.15), glowStripMat);
        strip.position.set(0, 0.15, -6.4);
        roomContainer.add(strip);

        const torusMat = new THREE.MeshStandardMaterial({ color: 0x43b581, emissive: 0x43b581, emissiveIntensity: 0.1 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 12, 24), torusMat);
        ring.position.set(0, 2.8, -6.2);
        roomContainer.add(ring);

        const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e2028, roughness: 0.6, metalness: 0.2 });
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.3, 12), tableMat);
        table.position.set(0, -0.15, 0.5);
        table.receiveShadow = true;
        table.castShadow = true;
        roomContainer.add(table);
    }

    function buildParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 14;
            if (i % 3 === 1) positions[i] = Math.random() * 4;
            if (i % 3 === 2) positions[i] = (Math.random() - 0.5) * 10 - 2;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x43b581,
            size: 0.03,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    function buildChair(group, x, z) {
        const chairGroup = new THREE.Group();
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2d35, roughness: 0.7, metalness: 0.1 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.55), seatMat);
        seat.position.y = 0.08;
        seat.castShadow = true;
        chairGroup.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), seatMat);
        back.position.set(0, 0.25, -0.25);
        chairGroup.add(back);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4, roughness: 0.4 });
        [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([dx, dz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 6), legMat);
            leg.position.set(dx, -0.04, dz);
            chairGroup.add(leg);
        });

        const glow = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.34, 24),
            new THREE.MeshBasicMaterial({ color: 0x43b581, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.12;
        glow.name = 'glow';
        chairGroup.add(glow);

        chairGroup.position.set(x, -0.15, z);
        group.add(chairGroup);
        return chairGroup;
    }

    function generateAvatarTexture(color, initial) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(64, 60, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial || '?', 64, 70);
        return c;
    }

    function updateAvatars(participants) {
        const count = participants.length;
        const radius = 2.0;
        const startAngle = -Math.PI / 2 - ((count - 1) * Math.PI / 12);
        const angleStep = Math.PI / 12;

        participants.forEach((p, i) => {
            const angle = startAngle + angleStep * i;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius + 1.0;

            if (!chairMeshes[i]) {
                chairMeshes[i] = buildChair(roomContainer, x, z);
            } else {
                chairMeshes[i].position.set(x, -0.15, z);
            }

            if (p.thumbnail) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const map = new THREE.CanvasTexture(img);
                    if (avatarSprites[i]) {
                        avatarSprites[i].material.map = map;
                        avatarSprites[i].material.needsUpdate = true;
                    }
                };
                img.src = p.thumbnail;
                if (!avatarSprites[i]) {
                    const map = new THREE.CanvasTexture(generateAvatarTexture('#43b581', p.name[0]));
                    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, sizeAttenuation: true });
                    const sprite = new THREE.Sprite(mat);
                    sprite.scale.set(0.55, 0.55, 1);
                    sprite.position.set(x, 0.75, z);
                    roomContainer.add(sprite);
                    avatarSprites[i] = sprite;
                } else {
                    avatarSprites[i].position.set(x, 0.75, z);
                }
            } else {
                const color = p.color || '#7289da';
                const map = new THREE.CanvasTexture(generateAvatarTexture(color, p.name[0]));
                if (!avatarSprites[i]) {
                    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, sizeAttenuation: true });
                    const sprite = new THREE.Sprite(mat);
                    sprite.scale.set(0.55, 0.55, 1);
                    sprite.position.set(x, 0.75, z);
                    roomContainer.add(sprite);
                    avatarSprites[i] = sprite;
                } else {
                    avatarSprites[i].material.map = map;
                    avatarSprites[i].material.needsUpdate = true;
                    avatarSprites[i].position.set(x, 0.75, z);
                }
            }

            const glow = chairMeshes[i].getObjectByName('glow');
            if (glow && p.speaking) {
                glow.material.opacity = 0.5;
            } else if (glow) {
                glow.material.opacity = 0;
            }
        });

        for (let i = count; i < Object.keys(chairMeshes).length; i++) {
            if (chairMeshes[i]) { roomContainer.remove(chairMeshes[i]); delete chairMeshes[i]; }
            if (avatarSprites[i]) { roomContainer.remove(avatarSprites[i]); delete avatarSprites[i]; }
        }
    }

    function highlightSpeaker(index) {
        Object.values(chairMeshes).forEach(c => {
            const g = c.getObjectByName('glow');
            if (g) g.material.opacity = 0;
        });
        const chair = chairMeshes[index];
        if (chair) {
            const g = chair.getObjectByName('glow');
            if (g) g.material.opacity = 0.6;
        }
    }

    let time = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.005;

        if (roomContainer) {
            roomContainer.rotation.y = Math.sin(time * 0.1) * 0.15;
            Object.values(avatarSprites).forEach(s => {
                if (s) { s.position.y = 0.75 + Math.sin(time + (s.id || 0)) * 0.03; }
            });
        }

        if (particles) {
            const pos = particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] += 0.002;
                if (pos[i] > 4) pos[i] = 0;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    function setSize(w, h) {
        if (renderer) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }

    return { init, updateAvatars, highlightSpeaker, setSize };
})();
