package com.meetingapp.meeting_app_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class SignalingController {

    @Autowired
    private SimpMessagingTemplate messaging;

    private final Map<String, Set<ParticipantInfo>> rooms = new ConcurrentHashMap<>();

    @MessageMapping("/room/join")
    public void join(@Payload JoinPayload payload) {
        String roomId = payload.roomId();
        String userId = payload.userId();

        rooms.putIfAbsent(roomId, ConcurrentHashMap.newKeySet());
        rooms.get(roomId).add(new ParticipantInfo(userId, payload.userName()));

        List<ParticipantInfo> participants = List.copyOf(rooms.get(roomId));

        messaging.convertAndSend("/topic/room/" + roomId + "/participants",
                new ParticipantsMessage(participants));

        messaging.convertAndSend("/topic/room/" + roomId + "/peer-joined",
                new PeerJoinedMessage(userId, payload.userName()));
    }

    @MessageMapping("/room/leave")
    public void leave(@Payload LeavePayload payload) {
        String roomId = payload.roomId();
        String userId = payload.userId();

        Set<ParticipantInfo> room = rooms.get(roomId);
        if (room != null) {
            room.removeIf(p -> p.userId().equals(userId));
            if (room.isEmpty()) {
                rooms.remove(roomId);
            }
        }

        messaging.convertAndSend("/topic/room/" + roomId + "/peer-left",
                new PeerLeftMessage(userId));
    }

    @MessageMapping("/room/offer")
    public void offer(@Payload OfferPayload payload) {
        messaging.convertAndSendToUser(payload.toUserId(), "/queue/room/" + payload.roomId() + "/offer",
                new ForwardedOfferMessage(payload.fromUserId(), payload.offer()));
    }

    @MessageMapping("/room/answer")
    public void answer(@Payload AnswerPayload payload) {
        messaging.convertAndSendToUser(payload.toUserId(), "/queue/room/" + payload.roomId() + "/answer",
                new ForwardedAnswerMessage(payload.fromUserId(), payload.answer()));
    }

    @MessageMapping("/room/ice")
    public void ice(@Payload IcePayload payload) {
        messaging.convertAndSendToUser(payload.toUserId(), "/queue/room/" + payload.roomId() + "/ice",
                new ForwardedIceMessage(payload.fromUserId(), payload.candidate()));
    }

    @MessageMapping("/room/mute")
    public void mute(@Payload MutePayload payload) {
        messaging.convertAndSend("/topic/room/" + payload.roomId() + "/mute",
                new MuteStatusMessage(payload.userId(), payload.muted()));
    }

    public record ParticipantInfo(String userId, String userName) {}
    record ParticipantsMessage(List<ParticipantInfo> participants) {}
    record PeerJoinedMessage(String userId, String userName) {}
    record PeerLeftMessage(String userId) {}
    record ForwardedOfferMessage(String fromUserId, Object offer) {}
    record ForwardedAnswerMessage(String fromUserId, Object answer) {}
    record ForwardedIceMessage(String fromUserId, Object candidate) {}
    record MuteStatusMessage(String userId, boolean muted) {}
}

record JoinPayload(String roomId, String userId, String userName) {}
record LeavePayload(String roomId, String userId) {}
record OfferPayload(String roomId, String fromUserId, String toUserId, Object offer) {}
record AnswerPayload(String roomId, String fromUserId, String toUserId, Object answer) {}
record IcePayload(String roomId, String fromUserId, String toUserId, Object candidate) {}
record MutePayload(String roomId, String userId, boolean muted) {}