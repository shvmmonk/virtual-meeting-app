const Signaling = (() => {
    let stompClient = null;
    let connected = false;
    let currentRoomId = null;
    let currentUserId = null;
    let handlers = {};

    function setHandlers(h) {
        handlers = h;
    }

    function connect(serverUrl, roomId, userId) {
        currentRoomId = roomId;
        currentUserId = userId;

        return new Promise((resolve, reject) => {
            const socket = new WebSocket(serverUrl);
            stompClient = Stomp.over(socket);
            stompClient.debug = () => {};

            stompClient.connect({}, () => {
                connected = true;
                subscribeToRoom();
                joinRoom();
                resolve();
            }, (err) => {
                stompClient = null;
                reject(err);
            });
        });
    }

    function subscribeToRoom() {
        const room = currentRoomId;

        stompClient.subscribe(`/topic/room/${room}/participants`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onParticipantsUpdate) handlers.onParticipantsUpdate(data.participants || []);
        });

        stompClient.subscribe(`/topic/room/${room}/peer-joined`, (msg) => {
            const data = JSON.parse(msg.body);
            if (data.userId !== currentUserId) {
                if (handlers.onPeerJoined) handlers.onPeerJoined(data);
            }
        });

        stompClient.subscribe(`/topic/room/${room}/peer-left`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onPeerLeft) handlers.onPeerLeft(data);
        });

        stompClient.subscribe(`/user/queue/room/${room}/offer`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onOffer) handlers.onOffer(data);
        });

        stompClient.subscribe(`/user/queue/room/${room}/answer`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onAnswer) handlers.onAnswer(data);
        });

        stompClient.subscribe(`/user/queue/room/${room}/ice`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onIceCandidate) handlers.onIceCandidate(data);
        });

        stompClient.subscribe(`/user/queue/room/${room}/mute`, (msg) => {
            const data = JSON.parse(msg.body);
            if (handlers.onPeerMute) handlers.onPeerMute(data);
        });
    }

    function joinRoom() {
        stompClient.send('/app/room/join', {}, JSON.stringify({
            roomId: currentRoomId,
            userId: currentUserId,
            userName: (handlers.getUserName ? handlers.getUserName() : 'Unknown')
        }));
    }

    function leaveRoom() {
        if (stompClient && connected) {
            stompClient.send('/app/room/leave', {}, JSON.stringify({
                roomId: currentRoomId,
                userId: currentUserId
            }));
        }
    }

    function sendOffer(toUserId, offer) {
        stompClient.send('/app/room/offer', {}, JSON.stringify({
            roomId: currentRoomId,
            fromUserId: currentUserId,
            toUserId,
            offer
        }));
    }

    function sendAnswer(toUserId, answer) {
        stompClient.send('/app/room/answer', {}, JSON.stringify({
            roomId: currentRoomId,
            fromUserId: currentUserId,
            toUserId,
            answer
        }));
    }

    function sendIceCandidate(toUserId, candidate) {
        stompClient.send('/app/room/ice', {}, JSON.stringify({
            roomId: currentRoomId,
            fromUserId: currentUserId,
            toUserId,
            candidate
        }));
    }

    function sendMuteStatus(muted) {
        if (stompClient && connected) {
            stompClient.send('/app/room/mute', {}, JSON.stringify({
                roomId: currentRoomId,
                userId: currentUserId,
                muted
            }));
        }
    }

    function disconnect() {
        leaveRoom();
        if (stompClient && connected) {
            stompClient.disconnect(() => {});
        }
        connected = false;
        stompClient = null;
    }

    return { connect, disconnect, sendOffer, sendAnswer, sendIceCandidate, sendMuteStatus, setHandlers, isConnected: () => connected };
})();
