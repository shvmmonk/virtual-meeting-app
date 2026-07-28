const CafeView = (() => {
    let container, playerEl, dotEl;
    let x = 300, y = 180;
    let npcs = [];
    let participants = [];
    let playerThumbnail = null;
    let active = false;
    let animId = null;

    const ROOM_W = 680, ROOM_H = 460, SIZE = 46;

    function init(containerEl) {
        container = containerEl;
        container.innerHTML = '';
        container.tabIndex = 0;

        // Floor
        container.style.background = 'repeating-conic-gradient(#e7d3b1 0% 25%, #ddc39d 0% 50%) 0 0 / 48px 48px';
        container.style.border = '8px solid #6e4527';
        container.style.borderRadius = '18px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';

        // Rugs
        const rug1 = ce('div', { className: 'cafe-rug', style: 'left:60px;top:150px;width:230px;height:150px;background:#c9705a;border-radius:16px;opacity:0.5;position:absolute;' });
        const rug2 = ce('div', { className: 'cafe-rug', style: 'left:400px;top:60px;width:190px;height:130px;background:#6f9d7a;border-radius:16px;opacity:0.5;position:absolute;' });
        container.append(rug1, rug2);

        // Plants
        const plantPositions = [[14,14], [630,14], [14,395]];
        plantPositions.forEach(([px, py]) => {
            const p = ce('div', { className: 'cafe-plant', style: `left:${px}px;top:${py}px;position:absolute;font-size:30px;filter:drop-shadow(0 4px 4px rgba(0,0,0,0.2));` });
            p.textContent = '🪴';
            container.appendChild(p);
        });

        // Tables
        const tableData = [
            [110, 190, '☕'], [440, 100, '📖'], [280, 300, '🧁']
        ];
        tableData.forEach(([tx, ty, emoji]) => {
            const t = ce('div', { className: 'cafe-table', style: `left:${tx}px;top:${ty}px;width:84px;height:84px;background:#8a5a37;border-radius:50%;position:absolute;box-shadow:0 6px 10px rgba(59,43,29,0.3),inset 0 0 0 4px #6e4527;display:flex;align-items:center;justify-content:center;font-size:26px;` });
            t.textContent = emoji;
            container.appendChild(t);
        });

        // Player
        playerEl = ce('div', { className: 'cafe-player', id: 'cafe-player', style: `left:${x}px;top:${y}px;width:46px;height:46px;border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 8px rgba(0,0,0,0.22),0 0 0 3px #e07856;transition:left 0.1s linear,top 0.1s linear;background:#f4b860;overflow:hidden;z-index:10;` });
        dotEl = ce('div', { style: 'position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:30px;height:9px;background:rgba(0,0,0,0.18);border-radius:50%;filter:blur(2px);z-index:-1;' });
        playerEl.appendChild(dotEl);
        const label = ce('div', { className: 'cafe-label', style: 'position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;background:rgba(59,43,29,0.85);color:white;padding:2px 8px;border-radius:100px;white-space:nowrap;' });
        label.textContent = 'You';
        playerEl.appendChild(label);
        container.appendChild(playerEl);

        // Keyboard
        container.addEventListener('click', () => container.focus());
        container.addEventListener('keydown', (e) => {
            if (!active) return;
            if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
            e.preventDefault();
            const speed = 14;
            if (e.key === 'ArrowUp') y -= speed;
            if (e.key === 'ArrowDown') y += speed;
            if (e.key === 'ArrowLeft') x -= speed;
            if (e.key === 'ArrowRight') x += speed;
            x = Math.max(4, Math.min(ROOM_W - SIZE - 4, x));
            y = Math.max(4, Math.min(ROOM_H - SIZE - 4, y));
            playerEl.style.left = x + 'px';
            playerEl.style.top = y + 'px';
        });

        container.focus();
    }

    function ce(tag, attrs) {
        const el = document.createElement(tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function setThumbnail(dataUrl) {
        playerThumbnail = dataUrl;
        if (playerEl) {
            if (dataUrl) {
                playerEl.style.background = 'none';
                playerEl.style.backgroundImage = `url(${dataUrl})`;
                playerEl.style.backgroundSize = 'cover';
                playerEl.style.backgroundPosition = 'center';
            } else {
                playerEl.style.background = '#f4b860';
                playerEl.style.backgroundImage = 'none';
            }
        }
    }

    function updateParticipants(list) {
        participants = list;
        // Remove old NPCs
        npcs.forEach(n => n.el.remove());
        npcs = [];

        const colors = ['#a7f0d8', '#ffb3a6', '#cabaff', '#a0d4e8', '#f5d0a0', '#c9b8e8'];
        const names = ['Aman', 'Sara', 'Kabir', 'Neha', 'Raj', 'Maya'];

        participants.forEach((p, i) => {
            if (p.id === document.querySelector('#cafe-player')?.dataset?.userId) return;
            const color = colors[i % colors.length];
            const name = p.name || names[i % names.length];
            const npcEl = ce('div', {
                className: 'cafe-npc',
                style: `left:${60 + Math.random() * 560}px;top:${60 + Math.random() * 340}px;width:46px;height:46px;border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 8px rgba(0,0,0,0.22);transition:left 2s linear,top 2s linear;overflow:hidden;z-index:5;`
            });
            const dot = ce('div', { style: 'position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:30px;height:9px;background:rgba(0,0,0,0.18);border-radius:50%;filter:blur(2px);z-index:-1;' });
            npcEl.appendChild(dot);
            const lbl = ce('div', { className: 'cafe-label', style: 'position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;background:rgba(59,43,29,0.85);color:white;padding:2px 8px;border-radius:100px;white-space:nowrap;' });
            lbl.textContent = name;
            npcEl.appendChild(lbl);

            if (p.thumbnail) {
                npcEl.style.background = 'none';
                npcEl.style.backgroundImage = `url(${p.thumbnail})`;
                npcEl.style.backgroundSize = 'cover';
                npcEl.style.backgroundPosition = 'center';
                npcEl.style.border = '2px solid ' + color;
            } else {
                npcEl.style.background = color;
                const init = ce('span', { style: 'font-family:Fraunces,serif;font-weight:600;font-size:16px;color:rgba(0,0,0,0.5);' });
                init.textContent = name[0];
                npcEl.appendChild(init);
            }

            container.appendChild(npcEl);

            const npc = { el: npcEl, targetX: parseInt(npcEl.style.left), targetY: parseInt(npcEl.style.top), wait: Math.random() * 5 };
            npcs.push(npc);
        });

        if (!animId) npcLoop();
    }

    function npcLoop() {
        animId = requestAnimationFrame(npcLoop);
        npcs.forEach(n => {
            n.wait -= 0.016;
            if (n.wait > 0) return;
            const cx = parseInt(n.el.style.left);
            const cy = parseInt(n.el.style.top);
            if (Math.abs(cx - n.targetX) < 5 && Math.abs(cy - n.targetY) < 5) {
                n.targetX = 50 + Math.random() * 580;
                n.targetY = 50 + Math.random() * 360;
                n.wait = 3 + Math.random() * 5;
            } else {
                const dx = n.targetX - cx;
                const dy = n.targetY - cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const step = 1.5;
                n.el.style.left = (cx + (dx/dist) * step) + 'px';
                n.el.style.top = (cy + (dy/dist) * step) + 'px';
            }
        });
    }

    function setActive(a) {
        active = a;
        if (!a && animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        if (a && container) container.focus();
    }

    function reset() {
        x = 300; y = 180;
        if (playerEl) {
            playerEl.style.left = x + 'px';
            playerEl.style.top = y + 'px';
        }
        npcs.forEach(n => n.el.remove());
        npcs = [];
        if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    return { init, setThumbnail, updateParticipants, setActive, reset };
})();