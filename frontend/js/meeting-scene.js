const MeetingScene = (() => {
    let scene, camera, renderer;
    let roomContainer;
    let chairMeshes = {};
    let avatarSprites = {};
    let walkers = [];
    let particles;
    let time = 0;

    const canvas = document.getElementById('meeting-canvas');

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0ebe3);
        scene.fog = new THREE.Fog(0xf0ebe3, 15, 25);

        camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
        camera.position.set(-2, 5.5, 9);
        camera.lookAt(0, 1, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.outputEncoding = THREE.sRGBEncoding;

        roomContainer = new THREE.Group();
        scene.add(roomContainer);

        buildLights();
        buildRoom();
        buildSmartBoard();
        buildTable();
        buildChairs();
        buildLounge();
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
        const ambient = new THREE.AmbientLight(0xffeedd, 0.5);
        scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0xffeedd, 0x887766, 0.6);
        scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff5e6, 0.9);
        sun.position.set(5, 12, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 20;
        sun.shadow.camera.left = -10;
        sun.shadow.camera.right = 10;
        sun.shadow.camera.top = 10;
        sun.shadow.camera.bottom = -10;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0x8888ff, 0.2);
        fill.position.set(-4, 3, -3);
        scene.add(fill);

        const warm = new THREE.PointLight(0xffaa55, 0.3, 10);
        warm.position.set(0, 3, 3);
        scene.add(warm);
    }

    function buildRoom() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.9 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4c9b8, roughness: 0.8 });
        const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe3, roughness: 1, side: THREE.BackSide });

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        roomContainer.add(floor);

        // Rug under the table area
        const rugMat = new THREE.MeshStandardMaterial({ color: 0x3a5a6e, roughness: 0.9 });
        const rug = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), rugMat);
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.01, 0);
        roomContainer.add(rug);

        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), ceilMat);
        ceil.position.y = 4;
        ceil.rotation.x = Math.PI / 2;
        roomContainer.add(ceil);

        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), wallMat);
        backWall.position.set(0, 2, -6);
        backWall.receiveShadow = true;
        roomContainer.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
        leftWall.position.set(-7, 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        roomContainer.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
        rightWall.position.set(7, 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        roomContainer.add(rightWall);

        // Baseboard
        const bbMat = new THREE.MeshStandardMaterial({ color: 0xc4b8a5, roughness: 0.7 });
        [-6, -2, 2, 6].forEach(x => {
            const bb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 12), bbMat);
            bb.position.set(x, 0.08, 0);
            roomContainer.add(bb);
        });

        // Wall clock
        const clockFaceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const clockFrameMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 20), clockFaceMat);
        clock.position.set(5.5, 3.2, -5.95);
        clock.rotation.x = 0;
        roomContainer.add(clock);
        const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), clockFrameMat);
        frame.position.set(5.5, 3.2, -5.94);
        roomContainer.add(frame);
        // Clock hands
        const handMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.01), handMat);
        h1.position.set(5.5, 3.22, -5.93);
        h1.rotation.z = 0.3;
        roomContainer.add(h1);
        const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), handMat);
        h2.position.set(5.5, 3.19, -5.93);
        h2.rotation.z = -0.8;
        roomContainer.add(h2);

        // Plant in corner
        buildPlant(5.5, 0, -5.5);
        buildPlant(-5.5, 0, -5.5);
    }

    function buildPlant(x, y, z) {
        const potMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4b, roughness: 0.8 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a4a, roughness: 0.9 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.25, 8), potMat);
        pot.position.set(x, y + 0.125, z);
        roomContainer.add(pot);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 6), leafMat);
        stem.position.set(x, y + 0.45, z);
        roomContainer.add(stem);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), leafMat);
        crown.position.set(x, y + 0.6, z);
        roomContainer.add(crown);
    }

    function buildSmartBoard() {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.5 });
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x1a2744,
            emissive: 0x1a3a6e,
            emissiveIntensity: 0.3,
            roughness: 0.2,
            metalness: 0.1
        });

        const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.1), frameMat);
        frame.position.set(0, 1.8, -5.94);
        roomContainer.add(frame);

        const screen = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.8, 0.02), screenMat);
        screen.position.set(0, 1.8, -5.89);
        screen.name = 'smart-board-screen';
        roomContainer.add(screen);

        // Glow around screen
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x4a7aff, transparent: true, opacity: 0.05 });
        const glow = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 0.02), glowMat);
        glow.position.set(0, 1.8, -5.88);
        glow.name = 'smart-board-glow';
        roomContainer.add(glow);

        // Small camera on top of screen
        const camMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const cam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.04), camMat);
        cam.position.set(0, 2.82, -5.93);
        roomContainer.add(cam);

        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), ledMat);
        led.position.set(0.1, 2.82, -5.93);
        roomContainer.add(led);
    }

    function setScreenShareStream(stream) {
        const screen = roomContainer.getObjectByName('smart-board-screen');
        if (!screen) return;
        const glow = roomContainer.getObjectByName('smart-board-glow');
        if (stream) {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            video.loop = true;
            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            screen.material = new THREE.MeshBasicMaterial({ map: texture });
            if (glow) glow.material.opacity = 0.15;
        } else {
            screen.material = new THREE.MeshStandardMaterial({
                color: 0x1a2744,
                emissive: 0x1a3a6e,
                emissiveIntensity: 0.3,
            });
            if (glow) glow.material.opacity = 0.05;
        }
    }

    function buildTable() {
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.6 });
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.2), tableMat);
        tableTop.position.set(0, 0.75, 0);
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        roomContainer.add(tableTop);

        const legMat = new THREE.MeshStandardMaterial({ color: 0x6b5d4b, metalness: 0.3, roughness: 0.5 });
        [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), legMat);
            leg.position.set(x, 0.35, z);
            roomContainer.add(leg);
        });
    }

    function buildChair(x, z, rotY = 0) {
        const g = new THREE.Group();
        const seatMat = new THREE.MeshStandardMaterial({ color: 0xa0907c, roughness: 0.7 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4, roughness: 0.3 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), seatMat);
        seat.position.y = 0.44;
        seat.castShadow = true;
        g.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.04), seatMat);
        back.position.set(0, 0.6, -0.22);
        g.add(back);

        [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([dx, dz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.4, 6), metalMat);
            leg.position.set(dx, 0.2, dz);
            g.add(leg);
        });

        const glow = new THREE.Mesh(
            new THREE.RingGeometry(0.25, 0.28, 20),
            new THREE.MeshBasicMaterial({ color: 0x4a7aff, transparent: true, opacity: 0, side: THREE.DoubleSide })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.48;
        glow.name = 'glow';
        g.add(glow);

        g.position.set(x, 0, z);
        g.rotation.y = rotY;
        roomContainer.add(g);
        return g;
    }

    function buildChairs() {
        // Around the table
        const positions = [
            [-1.0, -0.8, 0], [1.0, -0.8, 0],           // front
            [-1.0, 0.8, Math.PI], [1.0, 0.8, Math.PI],     // back
            [-1.6, 0, Math.PI / 2], [1.6, 0, -Math.PI / 2] // sides
        ];
        positions.forEach(([x, z, r]) => buildChair(x, z, r));
    }

    function buildLounge() {
        const couchMat = new THREE.MeshStandardMaterial({ color: 0x7a9e7e, roughness: 0.9 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0x9aba9e, roughness: 0.9 });

        // Couch base
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.7), couchMat);
        base.position.set(4.5, 0.15, -2.5);
        base.castShadow = true;
        base.receiveShadow = true;
        roomContainer.add(base);

        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.12), couchMat);
        back.position.set(4.5, 0.45, -2.85);
        roomContainer.add(back);

        // Armrests
        [-1, 1].forEach(s => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.7), couchMat);
            arm.position.set(4.5 + s * 0.82, 0.38, -2.5);
            roomContainer.add(arm);
        });

        // Pillows
        [-0.3, 0, 0.3].forEach(dx => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), pillowMat);
            p.position.set(4.5 + dx, 0.32, -2.5);
            roomContainer.add(p);
        });

        // Small side table
        const stMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.6 });
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8), stMat);
        st.position.set(5.8, 0.15, -2.5);
        roomContainer.add(st);

        // Lying-down people on the couch
        const lyingTex1 = generateAvatarTexture('#e8a87c', 'R');
        const lyingTex2 = generateAvatarTexture('#a0c9c0', 'L');
        const lieMat1 = new THREE.SpriteMaterial({ map: lyingTex1, transparent: true, depthTest: false, sizeAttenuation: true });
        const lieMat2 = new THREE.SpriteMaterial({ map: lyingTex2, transparent: true, depthTest: false, sizeAttenuation: true });
        const lie1 = new THREE.Sprite(lieMat1);
        lie1.scale.set(0.5, 0.5, 1);
        lie1.position.set(4.2, 0.3, -2.5);
        lie1.rotation.x = Math.PI / 2;
        roomContainer.add(lie1);
        const lie2 = new THREE.Sprite(lieMat2);
        lie2.scale.set(0.5, 0.5, 1);
        lie2.position.set(4.8, 0.3, -2.5);
        lie2.rotation.x = Math.PI / 2;
        roomContainer.add(lie2);
    }

    function buildParticles() {
        const count = 60;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            pos[i] = (Math.random() - 0.5) * 12;
            if (i % 3 === 1) pos[i] = Math.random() * 2 + 1.5;
            if (i % 3 === 2) pos[i] = (Math.random() - 0.5) * 8 - 2;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffddaa,
            size: 0.015,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        particles = new THREE.Points(geo, mat);
        scene.add(particles);
    }

    function buildAvatarSprite(texture, x, y, z, scale = 0.5) {
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(x, y, z);
        roomContainer.add(sprite);
        return sprite;
    }

    function generateAvatarTexture(color, initial) {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(64, 58, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial || '?', 64, 68);
        return new THREE.CanvasTexture(c);
    }

    function createWalker(texture, name) {
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.4, 0.4, 1);
        const startX = (Math.random() - 0.5) * 8;
        const startZ = (Math.random() - 0.5) * 6 - 1;
        sprite.position.set(startX, 0.6, startZ);
        roomContainer.add(sprite);

        return {
            sprite,
            targetX: startX,
            targetZ: startZ,
            speed: 0.3 + Math.random() * 0.3,
            waitTime: 0,
            state: 'walking',
            name
        };
    }

    function updateWalkers(delta) {
        walkers.forEach(w => {
            if (w.state === 'waiting') {
                w.waitTime -= delta;
                if (w.waitTime <= 0) {
                    w.targetX = (Math.random() - 0.5) * 9;
                    w.targetZ = (Math.random() - 0.5) * 7 - 1;
                    w.state = 'walking';
                }
                return;
            }

            const dx = w.targetX - w.sprite.position.x;
            const dz = w.targetZ - w.sprite.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.1) {
                w.state = 'waiting';
                w.waitTime = 2 + Math.random() * 4;
                return;
            }

            const step = w.speed * delta;
            w.sprite.position.x += (dx / dist) * step;
            w.sprite.position.z += (dz / dist) * step;

            // Add a subtle idle bob while walking
            w.sprite.position.y = 0.6 + Math.sin(time * 3 + (w.sprite.id || 0)) * 0.02;
        });
    }

    function updateAvatars(participants) {
        // Clear old
        Object.values(chairMeshes).forEach(c => { roomContainer.remove(c); });
        Object.values(avatarSprites).forEach(s => { roomContainer.remove(s); });
        chairMeshes = {};
        avatarSprites = {};

        const radius = 1.5;
        const centerY = 0.85;

        participants.forEach((p, i) => {
            const angle = -Math.PI / 2 + (i / Math.max(participants.length - 1, 1)) * Math.PI;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const texture = p.thumbnail ? (() => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                img.onload = () => {
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 128, 128);
                    const tex = new THREE.CanvasTexture(canvas);
                    if (avatarSprites[i]) {
                        avatarSprites[i].material.map = tex;
                        avatarSprites[i].material.needsUpdate = true;
                    }
                };
                img.src = p.thumbnail;
                return generateAvatarTexture('#4a7aff', p.name[0]);
            })() : generateAvatarTexture('#4a7aff', p.name[0]);

            const sprite = buildAvatarSprite(texture, x, centerY, z, 0.5);
            sprite.userData = { index: i };
            avatarSprites[i] = sprite;

            if (p.thumbnail) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const tex = new THREE.CanvasTexture(img);
                    if (avatarSprites[i]) {
                        avatarSprites[i].material.map = tex;
                        avatarSprites[i].material.needsUpdate = true;
                    }
                };
                img.src = p.thumbnail;
            }
        });
    }

    function addWalker(name, color) {
        const tex = generateAvatarTexture(color, name[0]);
        const w = createWalker(tex, name);
        walkers.push(w);
        return w;
    }

    function highlightSpeaker(index) {
        Object.values(avatarSprites).forEach((s, i) => {
            s.scale.set(i === index ? 0.6 : 0.5, i === index ? 0.6 : 0.5, 1);
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = 0.016;
        time += delta;

        roomContainer.rotation.y = Math.sin(time * 0.08) * 0.08;

        Object.values(avatarSprites).forEach((s, i) => {
            s.position.y = 0.85 + Math.sin(time * 1.5 + i) * 0.02;
        });

        // Animate chatting people (subtle sway)
        roomContainer.children.forEach(c => {
            if (c.userData && c.userData.isChatter) {
                c.rotation.z = Math.sin(time * 1.2 + c.userData.phase) * 0.04;
            }
        });

        updateWalkers(delta);

        if (particles) {
            const pos = particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] += 0.001;
                if (pos[i] > 3.5) pos[i] = 0.5;
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

    function initWalkers(count = 3) {
        const colors = ['#e8a87c', '#c9b8a0', '#a0c9c0', '#c0a0c9', '#a0c9a0'];
        const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan'];
        for (let i = 0; i < count; i++) {
            addWalker(names[i % names.length], colors[i % colors.length]);
        }
        // Add a few standing-and-chatting people (stationary "walkers" near the back)
        for (let i = 0; i < 2; i++) {
            const tex = generateAvatarTexture(colors[(i+2) % colors.length], 'C');
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: true });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(0.45, 0.45, 1);
            sprite.position.set(-1.5 + i * 1.2, 0.65, -4 + i * 0.5);
            roomContainer.add(sprite);
            // Subtle sway animation data
            sprite.userData = { isChatter: true, phase: i * 2 };
        }
    }

    return { init, updateAvatars, highlightSpeaker, setSize, initWalkers, setScreenShareStream };
})();