const CafeView = (() => {
    const TILE = 32;
    const COLS = 25, ROWS = 18;
    const W = COLS * TILE, H = ROWS * TILE;

    let canvas, ctx, container;
    let player = { x: 8, y: 13, dir: 0, moving: false };
    let npcs = [];
    let localUserId = null;
    let playerThumbnail = null;
    let playerImg = null;
    let thumbCache = {};
    let keys = {};
    let active = false;
    let animId = null;
    let participants = [];
    let currentRoom = 'cafe';

    const rooms = {
        cafe: {
            label: 'Cozy Room',
            bg: '#f5e6d0', grid: null,
            spawn: { x: 8, y: 11 },
            doors: [{ x: 22, y: 8, target: 'meeting', spawn: { x: 2, y: 8 } }]
        },
        meeting: {
            label: 'Activity Room',
            bg: '#e8f0e8', grid: null,
            spawn: { x: 2, y: 8 },
            doors: [{ x: 0, y: 8, target: 'cafe', spawn: { x: 21, y: 8 } }]
        }
    };

    const T = { FLOOR:0, WALL:1, TABLE:2, PLANT:3, RUG:4, DOOR:5, CHAIR:6, COUCH:7, DESK:8, SHELF:9, LAMP:10 };

    function buildGrid(roomName) {
        const g = Array.from({length:ROWS}, () => Array(COLS).fill(T.FLOOR));
        if (roomName === 'cafe') {
            for (let i=0;i<COLS;i++) { g[0][i]=T.WALL; g[ROWS-1][i]=T.WALL; }
            for (let i=0;i<ROWS;i++) { g[i][0]=T.WALL; g[i][COLS-1]=T.WALL; }

            g[8][COLS-1] = T.DOOR;

            // Large cozy rug
            placeRect(g, 5, 5, 8, 6, T.RUG);
            placeRect(g, 17, 2, 4, 5, T.RUG);

            // Desk with lamp
            placeRect(g, 5, 3, 3, 2, T.DESK);
            g[4][5] = T.LAMP;

            // Bookshelf
            placeRect(g, 2, 9, 2, 3, T.SHELF);

            // Round table
            placeRect(g, 10, 10, 3, 3, T.TABLE);
            g[10][10]=T.CHAIR; g[10][12]=T.CHAIR; g[12][10]=T.CHAIR; g[12][12]=T.CHAIR;

            // Cozy couch
            placeRect(g, 2, 15, 4, 1, T.COUCH);

            // Plants
            g[3][20] = T.PLANT; g[2][2] = T.PLANT; g[ROWS-3][COLS-4] = T.PLANT;
        } else if (roomName === 'meeting') {
            for (let i=0;i<COLS;i++) { g[0][i]=T.WALL; g[ROWS-1][i]=T.WALL; }
            for (let i=0;i<ROWS;i++) { g[i][0]=T.WALL; g[i][COLS-1]=T.WALL; }

            g[8][0] = T.DOOR;

            // Activity table
            placeRect(g, 8, 6, 6, 4, T.TABLE);
            g[7][8]=T.CHAIR; g[7][13]=T.CHAIR; g[11][8]=T.CHAIR; g[11][13]=T.CHAIR;

            // Rug
            placeRect(g, 8, 8, 6, 2, T.RUG);

            // Desks
            placeRect(g, 3, 2, 2, 2, T.DESK);
            placeRect(g, 18, 2, 2, 2, T.DESK);

            // Lamps
            g[3][3] = T.LAMP; g[18][3] = T.LAMP;

            // Plants
            g[2][COLS-3] = T.PLANT; g[ROWS-3][2] = T.PLANT;

            // Shelf
            placeRect(g, 18, 12, 2, 3, T.SHELF);
        }
        return g;
    }

    function placeRect(g, x, y, w, h, val) {
        for (let dy=0;dy<h;dy++) for (let dx=0;dx<w;dx++) {
            if (y+dy<ROWS && x+dx<COLS) g[y+dy][x+dx] = val;
        }
    }

    const tileColors = {
        [T.FLOOR]: ['#f5e6d0','#f0dfc0'],
        [T.WALL]: '#e8d4b8',
        [T.TABLE]: '#b8864e',
        [T.PLANT]: '#7aad6e',
        [T.RUG]: '#c97d63',
        [T.DOOR]: '#8ba86e',
        [T.CHAIR]: '#c4a882',
        [T.COUCH]: '#7a9e7e',
        [T.DESK]: '#8a7358',
        [T.SHELF]: '#8b6b4b',
        [T.LAMP]: '#f0d890'
    };

    function init(containerEl, userId) {
        container = containerEl;
        localUserId = userId || null;
        container.innerHTML = '';

        canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.imageRendering = 'pixelated';
        container.appendChild(canvas);

        ctx = canvas.getContext('2d');

        // Room label
        const label = document.createElement('div');
        label.id = 'cafe-room-label';
        label.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(180,150,120,0.85);color:#fff;padding:5px 18px;border-radius:100px;font-size:12px;font-weight:600;z-index:20;pointer-events:none;backdrop-filter:blur(6px);box-shadow:0 2px 8px rgba(0,0,0,0.15);letter-spacing:0.5px;';
        container.appendChild(label);

        // Proximity popup
        const popup = document.createElement('div');
        popup.id = 'cafe-proximity-popup';
        popup.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(180,150,120,0.9);backdrop-filter:blur(12px);border-radius:16px;padding:10px 18px;z-index:20;display:none;gap:8px;align-items:center;pointer-events:none;color:#fff;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
        container.appendChild(popup);

        // Hint
        const hint = document.createElement('div');
        hint.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.35);font-size:10px;z-index:20;pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,0.5);';
        hint.textContent = 'WASD / Arrow keys to walk  •  Walk through 🚪 doors  •  Explore!';
        container.appendChild(hint);

        for (const name in rooms) rooms[name].grid = buildGrid(name);

        // Load room
        switchRoom('cafe');

        // Keys
        container.addEventListener('click', () => container.focus());

        container.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(e.key)) {
                e.preventDefault();
            }
        });
        container.addEventListener('keyup', (e) => { keys[e.key] = false; });

        container.focus();
    }

    function switchRoom(name) {
        currentRoom = name;
        const room = rooms[name];
        if (!room) return;
        const sp = room.spawn;
        player.x = sp.x; player.y = sp.y;
        document.getElementById('cafe-room-label').textContent = room.label;
        updateNpcPositions();
    }

    function updateNpcPositions() {
        const room = rooms[currentRoom];
        if (!room) return;
        const grid = room.grid;
        npcs.forEach(n => {
            let tries = 0;
            do {
                n.x = 2 + Math.floor(Math.random() * (COLS - 4));
                n.y = 2 + Math.floor(Math.random() * (ROWS - 4));
                tries++;
            } while (tries < 50 && (grid[n.y][n.x] !== T.FLOOR || (n.x === player.x && n.y === player.y)));
        });
    }

    function isWalkable(grid, x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        const t = grid[y][x];
        return t === T.FLOOR || t === T.RUG || t === T.DOOR;
    }

    function ce(tag, attrs) {
        const el = document.createElement(tag);
        for (const k in attrs) {
            if (k === 'className') el.className = attrs[k];
            else el.setAttribute(k, attrs[k]);
        }
        return el;
    }

    function setThumbnail(dataUrl) {
        playerThumbnail = dataUrl;
        if (dataUrl) {
            const img = new Image();
            img.src = dataUrl;
            playerImg = img;
        } else {
            playerImg = null;
        }
    }

    function updateParticipants(list) {
        participants = list;
        npcs = [];
        const colors = ['#a7f0d8', '#ffb3a6', '#cabaff', '#a0d4e8', '#f5d0a0', '#c9b8e8'];
        const names = ['Aman', 'Sara', 'Kabir', 'Neha', 'Raj', 'Maya'];
        list.forEach((p, i) => {
            if (p.id === localUserId) return;
            const room = rooms[currentRoom];
            let x = 3 + Math.floor(Math.random() * (COLS - 6));
            let y = 3 + Math.floor(Math.random() * (ROWS - 6));
            if (room) {
                const g = room.grid;
                let tries = 0;
                while (tries < 30 && g[y][x] !== T.FLOOR) {
                    x = 2 + Math.floor(Math.random() * (COLS - 4));
                    y = 2 + Math.floor(Math.random() * (ROWS - 4));
                    tries++;
                }
            }
            // Preload thumbnail
            let img = null;
            if (p.thumbnail) {
                if (thumbCache[p.thumbnail]) {
                    img = thumbCache[p.thumbnail];
                } else {
                    img = new Image();
                    img.src = p.thumbnail;
                    thumbCache[p.thumbnail] = img;
                }
            }
            npcs.push({
                x, y,
                targetX: x, targetY: y,
                wait: Math.random() * 4,
                dir: 0,
                color: colors[i % colors.length],
                name: p.name || names[i % names.length],
                thumbnail: p.thumbnail,
                img: img,
                id: p.id
            });
        });
    }

    function setActive(a) {
        active = a;
        if (a) {
            if (!animId) gameLoop();
            if (container) container.focus();
        } else {
            if (animId) { cancelAnimationFrame(animId); animId = null; }
        }
    }

    function gameLoop() {
        animId = requestAnimationFrame(gameLoop);
        update(0.016);
        draw();
    }

    function update(dt) {
        if (!active) return;
        const room = rooms[currentRoom];
        if (!room) return;
        const grid = room.grid;

        // Player movement
        let dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;

        if (dx !== 0 && dy !== 0) {
            if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
                // Prefer horizontal or vertical based on which was pressed first
                // For diagonal, reduce to one axis to avoid speed boost
                if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['d']) dy = 0;
                else dx = 0;
            }
        }

        if (dx !== 0 || dy !== 0) {
            player.dir = dx === 1 ? 0 : dx === -1 ? Math.PI : dy === -1 ? -Math.PI/2 : Math.PI/2;
            player.moving = true;

            const speed = 2.5;

            // Try X then Y
            let nx = player.x + dx * speed * dt * 8;
            let ny = player.y;
            if (isWalkable(grid, Math.round(nx), Math.round(ny))) {
                player.x = nx;
            }

            nx = player.x;
            ny = player.y + dy * speed * dt * 8;
            if (isWalkable(grid, Math.round(nx), Math.round(ny))) {
                player.y = ny;
            }

            // Clamp
            player.x = Math.max(0.5, Math.min(COLS - 0.5, player.x));
            player.y = Math.max(0.5, Math.min(ROWS - 0.5, player.y));

            // Door check
            const px = Math.round(player.x), py = Math.round(player.y);
            if (px >= 0 && px < COLS && py >= 0 && py < ROWS && grid[py][px] === T.DOOR) {
                const door = room.doors.find(d => d.x === px && d.y === py);
                if (door) {
                    switchRoom(door.target);
                    player.x = door.spawn.x;
                    player.y = door.spawn.y;
                }
            }
        } else {
            player.moving = false;
        }

        // NPC roaming
        npcs.forEach(n => {
            n.wait -= dt;
            if (n.wait > 0) return;
            const dist = Math.abs(n.x - n.targetX) + Math.abs(n.y - n.targetY);
            if (dist < 0.3) {
                const room2 = rooms[currentRoom];
                const g2 = room2 ? room2.grid : null;
                if (g2) {
                    let tries = 0;
                    do {
                        n.targetX = 2 + Math.floor(Math.random() * (COLS - 4));
                        n.targetY = 2 + Math.floor(Math.random() * (ROWS - 4));
                        tries++;
                    } while (tries < 20 && g2[Math.round(n.targetY)][Math.round(n.targetX)] !== T.FLOOR);
                }
                n.wait = 2 + Math.random() * 4;
            } else {
                const s = 0.4;
                const adx = Math.sign(n.targetX - n.x);
                const ady = Math.sign(n.targetY - n.y);
                if (adx !== 0) n.x += adx * s * dt * 4;
                else n.y += ady * s * dt * 4;
            }
        });

        // Proximity
        const popup = document.getElementById('cafe-proximity-popup');
        let nearPerson = null;
        npcs.forEach(n => {
            const d = Math.sqrt((player.x - n.x)**2 + (player.y - n.y)**2);
            if (d < 1.8) nearPerson = n;
        });
        if (nearPerson && popup) {
            popup.style.display = 'flex';
            popup.innerHTML = `<span style="font-size:18px;">👋</span> Near <strong>${nearPerson.name}</strong>`;
        } else if (popup) {
            popup.style.display = 'none';
        }
    }

    function draw() {
        const room = rooms[currentRoom];
        if (!room || !ctx) return;
        const grid = room.grid;

        ctx.clearRect(0, 0, W, H);

        // Tiles
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const t = grid[y][x];
                const px = x * TILE, py = y * TILE;
                if (t === T.FLOOR) {
                    const c = (x + y) % 2 === 0 ? tileColors[T.FLOOR][0] : tileColors[T.FLOOR][1];
                    ctx.fillStyle = c;
                    ctx.fillRect(px, py, TILE, TILE);
                } else {
                    ctx.fillStyle = tileColors[t] || '#ccc';
                    ctx.fillRect(px, py, TILE, TILE);
                    if (t === T.RUG) {
                        ctx.fillStyle = 'rgba(220,180,160,0.5)';
                        ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
                        // Fringe
                        ctx.fillStyle = 'rgba(200,160,140,0.4)';
                        ctx.fillRect(px+1, py+TILE-3, TILE-2, 2);
                    }
                }
            }
        }

        // Furniture details
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const t = grid[y][x];
                const px = x * TILE, py = y * TILE;
                if (t === T.DOOR) {
                    ctx.fillStyle = 'rgba(139,168,110,0.25)';
                    ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
                    ctx.strokeStyle = '#8ba86e';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3,3]);
                    ctx.strokeRect(px+3, py+3, TILE-6, TILE-6);
                    ctx.setLineDash([]);
                    // Door icon
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🚪', px+TILE/2, py+TILE/2);
                }
                if (t === T.TABLE) {
                    ctx.fillStyle = '#b8864e';
                    ctx.beginPath();
                    ctx.arc(px+TILE/2, py+TILE/2-1, 9, 0, Math.PI*2);
                    ctx.fill();
                    ctx.strokeStyle = '#a07040';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                if (t === T.PLANT) {
                    // Pot
                    ctx.fillStyle = '#c0845c';
                    ctx.beginPath();
                    ctx.moveTo(px+TILE/2-5, py+TILE/2+6);
                    ctx.lineTo(px+TILE/2+5, py+TILE/2+6);
                    ctx.lineTo(px+TILE/2+3, py+TILE/2);
                    ctx.lineTo(px+TILE/2-3, py+TILE/2);
                    ctx.closePath();
                    ctx.fill();
                    // Leaves
                    ctx.fillStyle = '#7aad6e';
                    ctx.beginPath();
                    ctx.arc(px+TILE/2, py+TILE/2-3, 6, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#8abd7e';
                    ctx.beginPath();
                    ctx.arc(px+TILE/2-2, py+TILE/2-5, 3, 0, Math.PI*2);
                    ctx.fill();
                }
                if (t === T.CHAIR) {
                    ctx.fillStyle = '#c4a882';
                    const s = 6;
                    ctx.roundRect(px+s, py+s, TILE-s*2, TILE-s*2, 3);
                    ctx.fill();
                    ctx.strokeStyle = '#a08868';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
                if (t === T.COUCH) {
                    ctx.fillStyle = '#7a9e7e';
                    ctx.roundRect(px+2, py+4, TILE-4, TILE-8, 4);
                    ctx.fill();
                    ctx.fillStyle = '#8aae8e';
                    ctx.fillRect(px+4, py+2, TILE-8, 4);
                }
                if (t === T.DESK) {
                    ctx.fillStyle = '#8a7358';
                    ctx.roundRect(px+2, py+4, TILE-4, 6, 2);
                    ctx.fill();
                    ctx.fillStyle = '#7a6348';
                    ctx.fillRect(px+5, py+10, TILE-10, TILE-14);
                    // Item on desk
                    ctx.fillStyle = '#e8d8c0';
                    ctx.fillRect(px+8, py+6, 5, 4);
                }
                if (t === T.SHELF) {
                    ctx.fillStyle = '#8b6b4b';
                    ctx.fillRect(px+2, py+2, TILE-4, 4);
                    ctx.fillRect(px+2, py+TILE/2-2, TILE-4, 4);
                    ctx.fillRect(px+2, py+TILE-6, TILE-4, 4);
                    // Books
                    const bookColors = ['#c0392b','#2980b9','#8e44ad','#27ae60'];
                    for (let b=0; b<3; b++) {
                        ctx.fillStyle = bookColors[b % bookColors.length];
                        ctx.fillRect(px+4+b*8, py+8, 6, TILE/2-12);
                    }
                }
                if (t === T.LAMP) {
                    // Base
                    ctx.fillStyle = '#8a7a6a';
                    ctx.fillRect(px+TILE/2-2, py+TILE-6, 4, 4);
                    // Stem
                    ctx.fillStyle = '#a09080';
                    ctx.fillRect(px+TILE/2-1, py+8, 2, TILE-16);
                    // Shade
                    ctx.fillStyle = '#f0d890';
                    ctx.beginPath();
                    ctx.moveTo(px+TILE/2-6, py+8);
                    ctx.lineTo(px+TILE/2+6, py+8);
                    ctx.lineTo(px+TILE/2+4, py+2);
                    ctx.lineTo(px+TILE/2-4, py+2);
                    ctx.closePath();
                    ctx.fill();
                    // Glow
                    ctx.fillStyle = 'rgba(240,216,144,0.12)';
                    ctx.beginPath();
                    ctx.arc(px+TILE/2, py+4, 10, 0, Math.PI*2);
                    ctx.fill();
                }
                if (t === T.WALL) {
                    ctx.fillStyle = 'rgba(210,190,165,0.3)';
                    ctx.fillRect(px, py, TILE, TILE);
                    // Subtle wallpaper line
                    ctx.fillStyle = 'rgba(200,180,155,0.2)';
                    ctx.fillRect(px, py+TILE/2-1, TILE, 1);
                }
            }
        }

        // NPCs
        npcs.forEach(n => {
            const px = n.x * TILE, py = n.y * TILE;
            const r = 12;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(px+TILE/2, py+TILE/2+8, r+2, 5, 0, 0, Math.PI*2);
            ctx.fill();

            if (n.thumbnail && n.img) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
                ctx.clip();
                ctx.drawImage(n.img, px+TILE/2-r, py+TILE/2-2-r, r*2, r*2);
                ctx.restore();
                ctx.beginPath();
                ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
                ctx.strokeStyle = n.color;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            } else {
                ctx.fillStyle = n.color;
                ctx.beginPath();
                ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 13px Fraunces,serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(n.name[0], px+TILE/2, py+TILE/2-2);
            }

            // Name
            ctx.fillStyle = 'rgba(59,43,29,0.85)';
            const tw = ctx.measureText(n.name).width;
            const lw = tw + 12;
            ctx.beginPath();
            const lx = px+TILE/2 - lw/2, ly = py+TILE/2 - r - 14;
            ctx.roundRect(lx, ly, lw, 16, 8);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '500 9px Inter,sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.name, px+TILE/2, ly + 8);
        });

        // Player
        const px = player.x * TILE, py = player.y * TILE;
        const r = 13;

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(px+TILE/2, py+TILE/2+8, r+2, 5, 0, 0, Math.PI*2);
        ctx.fill();

        // Direction indicator (pointing triangle)
        const dirAngle = player.dir;
        const tipX = px+TILE/2 + Math.cos(dirAngle) * (r + 2);
        const tipY = py+TILE/2-2 + Math.sin(dirAngle) * (r + 2);

        if (playerThumbnail && playerImg) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
            ctx.clip();
            ctx.drawImage(playerImg, px+TILE/2-r, py+TILE/2-2-r, r*2, r*2);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
            ctx.strokeStyle = '#e07856';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#f4b860';
            ctx.beginPath();
            ctx.arc(px+TILE/2, py+TILE/2-2, r, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#e07856';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = 'bold 14px Fraunces,serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('You', px+TILE/2, py+TILE/2-2);
        }

        // Direction arrow
        ctx.fillStyle = '#e07856';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - Math.cos(dirAngle - 1) * 5, tipY - Math.sin(dirAngle - 1) * 5);
        ctx.lineTo(tipX - Math.cos(dirAngle + 1) * 5, tipY - Math.sin(dirAngle + 1) * 5);
        ctx.closePath();
        ctx.fill();

        // You label
        ctx.fillStyle = 'rgba(59,43,29,0.85)';
        const youW = 26, youH = 14;
        const youX = px+TILE/2 - youW/2, youY = py+TILE/2 - r - 14;
        ctx.beginPath();
        ctx.roundRect(youX, youY, youW, youH, 7);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '500 8px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('You', px+TILE/2, youY + 7);
    }

    function reset() {
        const room = rooms['cafe'];
        if (room) { player.x = room.spawn.x; player.y = room.spawn.y; }
        player.dir = 0;
        npcs = [];
        currentRoom = 'cafe';
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (container) {
            const popup = document.getElementById('cafe-proximity-popup');
            if (popup) popup.style.display = 'none';
        }
    }

    return { init, setThumbnail, updateParticipants, setActive, reset, setLocalUserId: (id) => { localUserId = id; } };
})();