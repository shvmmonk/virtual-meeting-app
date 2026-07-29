const BitmojiRoom = (() => {
    let canvas, ctx, container;
    let playerImg = null;
    let active = false;

    const W = 800, H = 560;

    function init(containerEl) {
        container = containerEl;
        container.innerHTML = '';

        canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        canvas.style.borderRadius = '12px';
        container.appendChild(canvas);

        ctx = canvas.getContext('2d');
        draw();
    }

    function setThumbnail(dataUrl) {
        if (dataUrl) {
            const img = new Image();
            img.onload = () => { playerImg = img; if (active) draw(); };
            img.src = dataUrl;
        } else {
            playerImg = null;
            if (active) draw();
        }
    }

    function setActive(a) {
        active = a;
        if (a) draw();
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);

        // Wall
        const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
        wallGrad.addColorStop(0, '#f7ede0');
        wallGrad.addColorStop(0.6, '#f0e0cc');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, W, H);

        // Wallpaper pattern (vertical stripes)
        ctx.fillStyle = 'rgba(220,200,180,0.15)';
        for (let x = 0; x < W; x += 40) {
            ctx.fillRect(x, 0, 20, H * 0.65);
        }

        // Crown molding
        ctx.fillStyle = '#e0d0bc';
        ctx.fillRect(0, H * 0.65 - 4, W, 6);
        ctx.fillStyle = '#d8c8b4';
        ctx.fillRect(0, H * 0.65 - 2, W, 2);

        // Floor
        const floorGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
        floorGrad.addColorStop(0, '#c4a882');
        floorGrad.addColorStop(1, '#b89870');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, H * 0.65, W, H * 0.35);

        // Floor boards
        ctx.strokeStyle = 'rgba(180,150,120,0.3)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, H * 0.65);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = H * 0.65 + 20; y < H; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Baseboard
        ctx.fillStyle = '#d8c8b4';
        ctx.fillRect(0, H * 0.65 - 2, W, 6);

        // Large rug (perspective oval)
        ctx.fillStyle = '#c97d63';
        ctx.beginPath();
        ctx.ellipse(W/2, H * 0.78, 160, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d48d73';
        ctx.beginPath();
        ctx.ellipse(W/2, H * 0.78, 130, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b06d53';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(W/2, H * 0.78, 155, 57, 0, 0, Math.PI * 2);
        ctx.stroke();

        // === FURNITURE ===

        // Bookshelf (left)
        const shelfX = 30, shelfY = H * 0.25, shelfW = 120, shelfH = 180;
        ctx.fillStyle = '#8b6b4b';
        ctx.fillRect(shelfX, shelfY, shelfW, shelfH);
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(shelfX, shelfY, shelfW, 4);
        ctx.fillRect(shelfX, shelfY + 55, shelfW, 4);
        ctx.fillRect(shelfX, shelfY + 110, shelfW, 4);
        ctx.fillRect(shelfX, shelfY + shelfH - 4, shelfW, 4);
        // Books
        const bookCols = ['#c0392b','#2980b9','#8e44ad','#27ae60','#f39c12','#e74c3c'];
        for (let row = 0; row < 3; row++) {
            for (let b = 0; b < 5; b++) {
                ctx.fillStyle = bookCols[(row*5 + b) % bookCols.length];
                const bx = shelfX + 6 + b * 20, by = shelfY + 6 + row * 55;
                ctx.fillRect(bx, by, 14, 40);
                if (b % 2 === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(bx+2, by+4, 3, 10);
                }
            }
        }
        // Small plant on top
        ctx.fillStyle = '#6a9e5e';
        ctx.beginPath();
        ctx.arc(shelfX + shelfW - 20, shelfY - 6, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#5a8e4e';
        ctx.beginPath();
        ctx.arc(shelfX + shelfW - 16, shelfY - 10, 6, 0, Math.PI*2);
        ctx.fill();

        // Desk (center-right)
        const deskX = 420, deskY = H * 0.4, deskW = 180, deskH = 110;
        ctx.fillStyle = '#8a7358';
        ctx.fillRect(deskX, deskY, deskW, deskH);
        ctx.fillStyle = '#7a6348';
        ctx.fillRect(deskX, deskY, deskW, 6);
        ctx.fillRect(deskX, deskY + deskH - 4, deskW, 4);
        // Desk legs
        ctx.fillStyle = '#6a5338';
        ctx.fillRect(deskX + 8, deskY + deskH, 6, 30);
        ctx.fillRect(deskX + deskW - 14, deskY + deskH, 6, 30);

        // Laptop on desk
        ctx.fillStyle = '#333';
        ctx.fillRect(deskX + 40, deskY + 14, 60, 42);
        ctx.fillStyle = '#555';
        ctx.fillRect(deskX + 42, deskY + 56, 56, 4);
        // Screen glow
        ctx.fillStyle = 'rgba(74,111,165,0.15)';
        ctx.fillRect(deskX + 42, deskY + 16, 56, 38);

        // Coffee mug
        ctx.fillStyle = '#e8d8c0';
        ctx.beginPath();
        ctx.arc(deskX + 130, deskY + 30, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#d0c0a8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(deskX + 130, deskY + 30, 10, 0, Math.PI*2);
        ctx.stroke();
        // Handle
        ctx.strokeStyle = '#d0c0a8';
        ctx.beginPath();
        ctx.arc(deskX + 140, deskY + 30, 6, -0.5, 0.5);
        ctx.stroke();

        // Floor lamp (right)
        const lampX = 700, lampBaseY = H * 0.7;
        ctx.fillStyle = '#a09080';
        ctx.fillRect(lampX - 2, H * 0.5, 4, lampBaseY - H * 0.5);
        ctx.fillStyle = '#8a7a6a';
        ctx.fillRect(lampX - 10, lampBaseY, 20, 6);
        // Lamp shade
        ctx.fillStyle = '#f0d890';
        ctx.beginPath();
        ctx.moveTo(lampX - 20, H * 0.5);
        ctx.lineTo(lampX + 20, H * 0.5);
        ctx.lineTo(lampX + 12, H * 0.5 - 18);
        ctx.lineTo(lampX - 12, H * 0.5 - 18);
        ctx.closePath();
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(240,216,144,0.08)';
        ctx.beginPath();
        ctx.arc(lampX, H * 0.5 - 6, 40, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'rgba(240,216,144,0.04)';
        ctx.beginPath();
        ctx.arc(lampX, H * 0.5 - 6, 70, 0, Math.PI*2);
        ctx.fill();

        // Couch (left side)
        const couchX = 170, couchY = H * 0.62, couchW = 160, couchH = 70;
        ctx.fillStyle = '#7a9e7e';
        ctx.roundRect(couchX, couchY, couchW, couchH, 6);
        ctx.fill();
        ctx.fillStyle = '#8aae8e';
        ctx.roundRect(couchX + 8, couchY - 6, couchW - 16, 16, 4);
        ctx.fill();
        // Couch cushions
        for (let c = 0; c < 3; c++) {
            ctx.strokeStyle = 'rgba(100,140,110,0.3)';
            ctx.lineWidth = 1;
            ctx.roundRect(couchX + 8 + c * 48, couchY + 12, 44, 48, 4);
            ctx.stroke();
        }

        // Pillow on couch
        ctx.fillStyle = '#d4a882';
        ctx.roundRect(couchX + 20, couchY - 4, 28, 16, 6);
        ctx.fill();

        // === INTERACTIVE ELEMENTS ===

        // Picture frame on wall (left)
        const frameX = 250, frameY = H * 0.12;
        ctx.fillStyle = '#6a5a4a';
        ctx.fillRect(frameX, frameY, 100, 70);
        ctx.fillStyle = '#8a7a6a';
        ctx.fillRect(frameX - 2, frameY - 2, 104, 74);
        // Art
        ctx.fillStyle = '#c9d8c0';
        ctx.fillRect(frameX + 6, frameY + 6, 88, 58);
        ctx.fillStyle = '#a0b898';
        ctx.beginPath();
        ctx.arc(frameX + 50, frameY + 40, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#8aa878';
        ctx.beginPath();
        ctx.arc(frameX + 70, frameY + 30, 12, 0, Math.PI*2);
        ctx.fill();

        // Clock on wall (right side)
        const clockX = 600, clockY = H * 0.08;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(clockX, clockY, 24, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(clockX, clockY, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(clockX, clockY, 20, 0, Math.PI*2);
        ctx.stroke();
        // Hands
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX + 8, clockY - 10);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX - 6, clockY + 8);
        ctx.stroke();

        // === BITMOJI AVATAR ===
        const avatarX = 340, avatarY = H * 0.5;
        const avatarR = 48;

        if (playerImg) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI*2);
            ctx.clip();
            ctx.drawImage(playerImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
            ctx.restore();
            ctx.strokeStyle = '#e07856';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI*2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#f4b860';
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.font = 'bold 30px Inter,sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☺', avatarX, avatarY);
        }

        // Name label
        ctx.fillStyle = 'rgba(160,130,100,0.9)';
        const nameW = 140, nameH = 24;
        ctx.beginPath();
        ctx.roundRect(avatarX - nameW/2, avatarY + avatarR + 6, nameW, nameH, 12);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '500 12px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = document.getElementById('username-input')?.value || 'You';
        ctx.fillText(name, avatarX, avatarY + avatarR + 18);

        // === CLICKABLE ACTIVITY BUTTONS ===

        // Activity 1: Drawing board (left wall)
        drawActivityBtn(90, H * 0.14, 80, 50, '#e8c8a0', '🎨', 'Art');

        // Activity 2: Notes on shelf
        drawActivityBtn(40, H * 0.38, 60, 40, '#d4a882', '📝', 'Notes');

        // Activity 3: Book stack on desk
        drawActivityBtn(deskX + 120, deskY + 70, 50, 36, '#8e73c0', '📚', 'Books');

        // Activity 4: Board on right wall
        drawActivityBtn(W - 120, H * 0.14, 90, 60, '#4a6fa5', '📋', 'Activities');

        // Hint
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Click on activity items to explore', W/2, H - 8);
    }

    function drawActivityBtn(x, y, w, h, color, emoji, label) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.roundRect(x+2, y+2, w, h, 8);
        ctx.fill();
        // Background
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.stroke();
        // Emoji
        ctx.fillStyle = '#fff';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x + w/2, y + h/2 - 6);
        // Label
        ctx.font = '500 9px Inter,sans-serif';
        ctx.fillText(label, x + w/2, y + h/2 + 14);
    }

    function reset() {
        if (container) container.innerHTML = '';
        ctx = null;
        canvas = null;
    }

    return { init, setThumbnail, setActive, reset };
})();