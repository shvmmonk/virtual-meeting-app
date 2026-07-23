# Signaling API Contract — Spring Boot Backend

## WebSocket Endpoint
```
ws://localhost:8080/ws
```
Configure in Spring Boot with STOMP over raw WebSocket.

---

## STOMP Destinations

### Client → Server (`/app/...`)

| Destination | Payload | Description |
|-------------|---------|-------------|
| `/app/room/join` | `{ "roomId", "userId", "userName" }` | Join a room |
| `/app/room/leave` | `{ "roomId", "userId" }` | Leave a room |
| `/app/room/offer` | `{ "roomId", "fromUserId", "toUserId", "offer" }` | Send WebRTC offer |
| `/app/room/answer` | `{ "roomId", "fromUserId", "toUserId", "answer" }` | Send WebRTC answer |
| `/app/room/ice` | `{ "roomId", "fromUserId", "toUserId", "candidate" }` | Send ICE candidate |
| `/app/room/mute` | `{ "roomId", "userId", "muted" }` | Toggle mute status |

### Server → Client (subscriptions)

| Destination | Payload | When |
|-------------|---------|------|
| `/topic/room/{roomId}/participants` | `{ "participants": [...] }` | Participant list changes |
| `/topic/room/{roomId}/peer-joined` | `{ "userId", "userName" }` | New peer joined |
| `/topic/room/{roomId}/peer-left` | `{ "userId" }` | Peer left |
| `/user/queue/room/{roomId}/offer` | `{ "fromUserId", "offer" }` | Incoming WebRTC offer |
| `/user/queue/room/{roomId}/answer` | `{ "fromUserId", "answer" }` | Incoming WebRTC answer |
| `/user/queue/room/{roomId}/ice` | `{ "fromUserId", "candidate" }` | Incoming ICE candidate |
| `/user/queue/room/{roomId}/mute` | `{ "userId", "muted" }` | Peer mute status change |

---

## Spring Boot Config Needed

```
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/user");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws");
    }
}
```

### RoomController

```java
@Controller
public class SignalingController {

    // For tracking rooms in memory (use Redis later)
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();
    private final Map<String, SimpUser> userSessions = ...;

    @MessageMapping("/room/join")
    @SendTo("/topic/room/{roomId}/participants")
    public JoinResponse join(JoinPayload payload, SimpMessageHeaderAccessor headers) {
        // Add user to room, return updated participant list
    }

    @MessageMapping("/room/offer")
    public void offer(OfferPayload payload) {
        // Forward to specific user: /user/queue/room/{toUserId}/offer
    }

    @MessageMapping("/room/answer")
    public void answer(AnswerPayload payload) {
        // Forward to specific user
    }

    @MessageMapping("/room/ice")
    public void ice(IcePayload payload) {
        // Forward to specific user
    }

    @MessageMapping("/room/leave")
    @SendTo("/topic/room/{roomId}/peer-left")
    public LeaveResponse leave(LeavePayload payload) {
        // Remove user from room, broadcast
    }

    @MessageMapping("/room/mute")
    @SendTo("/topic/room/{roomId}/mute")
    public MuteResponse mute(MutePayload payload) {
        // Broadcast mute status
    }
}
```
