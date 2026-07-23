const AvatarBuilder = (() => {
    let scene, camera, renderer, controls;
    let avatarGroup = null;
    let currentConfig = null;

    const canvas = document.getElementById('avatar-canvas');

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2c2f33);

        camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
        camera.position.set(0, 1.5, 5);
        camera.lookAt(0, 0.8, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.8, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 2.5;
        controls.maxDistance = 8;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;
        controls.update();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 8, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-3, 2, -3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(-2, 4, -5);
        scene.add(rimLight);

        const floorGeo = new THREE.PlaneGeometry(6, 6);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x40434a, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.2;
        floor.receiveShadow = true;
        scene.add(floor);

        animate();

        window.addEventListener('resize', () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    function createMaterial(color, opts = {}) {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: opts.roughness || 0.4,
            metalness: opts.metalness || 0.0,
            flatShading: false,
            ...opts
        });
    }

    function buildAvatar(config) {
        if (avatarGroup) {
            scene.remove(avatarGroup);
            avatarGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }

        currentConfig = { ...config };
        avatarGroup = new THREE.Group();

        const skinMat = createMaterial(config.skinColor);
        const hairMat = createMaterial(config.hairColor);
        const eyeWhiteMat = createMaterial(0xffffff);
        const eyePupilMat = createMaterial(config.eyeColor);
        const outfitMat = createMaterial(config.outfitColor);
        const mouthMat = createMaterial(0xc0392b);

        buildHead(avatarGroup, skinMat, config);
        buildEyes(avatarGroup, eyeWhiteMat, eyePupilMat, config);
        buildMouth(avatarGroup, mouthMat, config);
        buildHair(avatarGroup, hairMat, config);
        buildBody(avatarGroup, outfitMat, skinMat, config);
        buildAccessory(avatarGroup, config);

        scene.add(avatarGroup);
    }

    function buildHead(group, skinMat, config) {
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), skinMat);
        head.position.y = 0.95;
        head.castShadow = true;
        group.add(head);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.1, 12), skinMat);
        neck.position.y = 0.65;
        group.add(neck);
    }

    function buildEyes(group, whiteMat, pupilMat, config) {
        const eyeOffset = 0.18;
        const eyeY = 1.05;
        const eyeZ = 0.4;

        if (config.eyeStyle === 'happy') {
            [-1, 1].forEach(side => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), whiteMat);
                eye.position.set(side * eyeOffset, eyeY, eyeZ);
                eye.scale.y = 0.5;
                group.add(eye);

                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
                pupil.position.set(side * eyeOffset + side * 0.02, eyeY - 0.01, eyeZ + 0.06);
                group.add(pupil);
            });
        } else if (config.eyeStyle === 'sleepy') {
            [-1, 1].forEach(side => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), whiteMat);
                eye.position.set(side * eyeOffset, eyeY - 0.05, eyeZ);
                eye.scale.y = 0.4;
                group.add(eye);

                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
                pupil.position.set(side * eyeOffset + side * 0.02, eyeY - 0.06, eyeZ + 0.06);
                group.add(pupil);
            });
        } else {
            [-1, 1].forEach(side => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), whiteMat);
                eye.position.set(side * eyeOffset, eyeY, eyeZ);
                group.add(eye);

                const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
                pupil.position.set(side * eyeOffset + side * 0.02, eyeY - 0.01, eyeZ + 0.06);
                group.add(pupil);
            });
        }
    }

    function buildMouth(group, mouthMat, config) {
        const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mouthMat);
        mouth.position.set(0, 0.88, 0.42);
        mouth.scale.set(1.2, 0.3, 0.5);
        group.add(mouth);
    }

    function buildHair(group, hairMat, config) {
        const style = config.hairStyle;
        const headY = 0.95;

        if (style === 'bald') return;

        if (style === 'short') {
            const hair = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
            hair.position.y = headY + 0.02;
            hair.scale.y = 0.35;
            group.add(hair);
        } else if (style === 'spiky') {
            const base = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
            base.position.y = headY + 0.02;
            base.scale.y = 0.3;
            group.add(base);

            for (let i = 0; i < 12; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), hairMat);
                const angle = (i / 12) * Math.PI * 2;
                const radius = 0.3;
                spike.position.set(Math.cos(angle) * radius, headY + 0.25, Math.sin(angle) * radius);
                spike.rotation.x = Math.sin(angle) * 0.3;
                spike.rotation.z = -Math.cos(angle) * 0.3;
                group.add(spike);
            }
        } else if (style === 'curly') {
            const base = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
            base.position.y = headY + 0.02;
            base.scale.y = 0.35;
            group.add(base);

            for (let i = 0; i < 8; i++) {
                const curl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), hairMat);
                const angle = (i / 8) * Math.PI * 2;
                const radius = 0.35;
                curl.position.set(Math.cos(angle) * radius, headY + 0.22 + Math.sin(i * 2) * 0.05, Math.sin(angle) * radius);
                group.add(curl);
            }
        } else if (style === 'long') {
            const top = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
            top.position.y = headY + 0.02;
            top.scale.y = 0.3;
            group.add(top);

            for (let i = 0; i < 6; i++) {
                const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.4, 6), hairMat);
                const angle = (i / 6) * Math.PI * 2;
                const radius = 0.35;
                strand.position.set(Math.cos(angle) * radius, headY - 0.15, Math.sin(angle) * radius);
                strand.rotation.x = Math.cos(angle) * 0.4;
                strand.rotation.z = Math.sin(angle) * 0.4;
                group.add(strand);
            }
        }
    }

    function buildBody(group, outfitMat, skinMat, config) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), outfitMat);
        body.position.y = 0.45;
        body.castShadow = true;
        group.add(body);

        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), outfitMat);
        collar.position.y = 0.6;
        group.add(collar);

        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 10), skinMat);
        leftArm.position.set(-0.33, 0.5, 0);
        leftArm.rotation.z = 0.15;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 10), skinMat);
        rightArm.position.set(0.33, 0.5, 0);
        rightArm.rotation.z = -0.15;
        group.add(rightArm);

        const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6 }));
        leftLeg.position.set(-0.13, 0.1, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6 }));
        rightLeg.position.set(0.13, 0.1, 0);
        group.add(rightLeg);

        if (config.outfitStyle === 'formal') {
            const tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.02), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.3 }));
            tie.position.set(0, 0.45, 0.16);
            group.add(tie);

            const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), outfitMat);
            lapelLeft.position.set(-0.12, 0.52, 0.16);
            group.add(lapelLeft);

            const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), outfitMat);
            lapelRight.position.set(0.12, 0.52, 0.16);
            group.add(lapelRight);
        } else if (config.outfitStyle === 'hoodie') {
            const hood = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16, Math.PI), outfitMat);
            hood.position.set(0, 0.68, -0.1);
            hood.rotation.x = 0.3;
            group.add(hood);

            const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 }));
            pocket.position.set(0, 0.35, 0.16);
            group.add(pocket);
        }
    }

    function buildAccessory(group, config) {
        const acc = config.accessory;
        if (acc === 'none') return;

        if (acc === 'glasses') {
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.5, roughness: 0.3 });
            [-1, 1].forEach(side => {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 16), frameMat);
                ring.position.set(side * 0.18, 1.02, 0.42);
                group.add(ring);
            });
            const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.015), frameMat);
            bridge.position.set(0, 1.02, 0.42);
            group.add(bridge);
            const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.015), frameMat);
            armL.position.set(-0.32, 1.02, 0.3);
            armL.rotation.y = 0.3;
            group.add(armL);
            const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.015), frameMat);
            armR.position.set(0.32, 1.02, 0.3);
            armR.rotation.y = -0.3;
            group.add(armR);
        } else if (acc === 'beanie') {
            const hatMat = createMaterial(config.hairColor);
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
            dome.position.y = 1.12;
            dome.scale.y = 0.5;
            group.add(dome);
            const brim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 16), hatMat);
            brim.position.y = 1.05;
            group.add(brim);
        } else if (acc === 'headphones') {
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.4, roughness: 0.5 });
            const padMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });

            const band = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 8, 16), bandMat);
            band.position.y = 1.1;
            band.rotation.x = Math.PI / 2;
            band.scale.z = 0.6;
            group.add(band);

            [-1, 1].forEach(side => {
                const pad = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), padMat);
                pad.position.set(side * 0.32, 0.92, 0);
                group.add(pad);
            });
        }
    }

    function getConfig() {
        const skinColor = document.getElementById('skin-color').value;
        const hairStyle = document.getElementById('hair-style').value;
        const hairColor = document.getElementById('hair-color').value;
        const eyeStyle = document.getElementById('eye-style').value;
        const eyeColor = document.getElementById('eye-color').value;
        const outfitColor = document.getElementById('outfit-color').value;
        const outfitStyle = document.getElementById('outfit-style').value;
        const accessory = document.getElementById('accessory').value;

        return { skinColor, hairStyle, hairColor, eyeStyle, eyeColor, outfitColor, outfitStyle, accessory };
    }

    function getDefaultConfig() {
        return {
            skinColor: '#f5cba7',
            hairStyle: 'short',
            hairColor: '#3d2314',
            eyeStyle: 'round',
            eyeColor: '#2c3e50',
            outfitColor: '#3498db',
            outfitStyle: 'casual',
            accessory: 'none'
        };
    }

    function setupBuilder() {
        init();
        const config = getConfig();
        buildAvatar(config);

        document.querySelectorAll('#skin-color, #hair-color, #eye-color, #outfit-color').forEach(input => {
            input.addEventListener('input', () => {
                const cfg = getConfig();
                buildAvatar(cfg);
            });
        });

        document.querySelectorAll('#hair-style, #eye-style, #outfit-style, #accessory').forEach(sel => {
            sel.addEventListener('change', () => {
                const cfg = getConfig();
                buildAvatar(cfg);
            });
        });
    }

    function captureThumbnail(width = 128, height = 128) {
        const origSize = { w: renderer.domElement.width, h: renderer.domElement.height };
        const origBg = scene.background;
        const origAutoRotate = controls.autoRotate;
        const origTheta = controls._theta;
        const origPhi = controls._phi;
        const origRadius = controls._radius;

        renderer.setSize(width, height);
        scene.background = new THREE.Color(0x3a3d42);
        controls.autoRotate = false;
        controls._theta = 0;
        controls._phi = Math.PI / 4;
        controls._radius = 4;
        controls.update();

        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL('image/png');

        controls._theta = origTheta;
        controls._phi = origPhi;
        controls._radius = origRadius;
        controls.autoRotate = origAutoRotate;
        renderer.setSize(origSize.w, origSize.h);
        scene.background = origBg;
        controls.update();

        return dataUrl;
    }

    function getCurrentConfig() {
        return currentConfig || getDefaultConfig();
    }

    return {
        setupBuilder,
        getConfig,
        getDefaultConfig,
        captureThumbnail,
        getCurrentConfig
    };
})();
