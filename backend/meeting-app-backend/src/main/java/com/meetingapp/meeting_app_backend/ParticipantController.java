package com.meetingapp.meeting_app_backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
public class ParticipantController {

    @GetMapping("/participants")
    public List<Participant> getParticipants() {
        return List.of(
            new Participant("User 1", "#7289da"),
            new Participant("User 2", "#43b581"),
            new Participant("User 3", "#f04747"),
            new Participant("User 4", "#faa61a")
        );
    }

    @GetMapping("/participants/search")
    public String searchParticipant(@RequestParam String name){
        return "You searched for:" + name;
    }

    @PostMapping("/participants")
    public Participant addParticipant(@RequestBody Participant newParticipant){
        return newParticipant;
    }
}