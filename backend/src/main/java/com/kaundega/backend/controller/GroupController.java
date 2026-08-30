package com.kaundega.backend.controller;

import com.kaundega.backend.dto.*;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.GroupRepository;
import com.kaundega.backend.repository.UserRepository;
import com.kaundega.backend.security.CustomUserDetails;
import com.kaundega.backend.service.BalanceCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final BalanceCalculationService balanceCalculationService;

    public GroupController(GroupRepository groupRepository, UserRepository userRepository, BalanceCalculationService balanceCalculationService) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.balanceCalculationService = balanceCalculationService;
    }

    @PostMapping
    public ResponseEntity<GroupDto> createGroup(@RequestBody CreateGroupRequest request, 
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        User creator = userDetails.getUser();
        List<User> members = new ArrayList<>();
        members.add(creator);

        Group group = Group.builder()
                .name(request.getName())
                .createdBy(creator)
                .members(members)
                .createdAt(LocalDateTime.now())
                .build();
        Group saved = groupRepository.save(group);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupDto> addMember(@PathVariable UUID groupId, 
                                              @RequestBody AddMemberRequest request) {
        Group group = groupRepository.findById(groupId).orElseThrow();
        User newMember = userRepository.findByEmail(request.getEmail()).orElseThrow();
        
        if (!group.getMembers().contains(newMember)) {
            group.getMembers().add(newMember);
            group = groupRepository.save(group);
        }
        return ResponseEntity.ok(mapToDto(group));
    }

    @GetMapping("/{groupId}/balances")
    public ResponseEntity<Map<UUID, BalanceDetails>> getBalances(@PathVariable UUID groupId) {
        return ResponseEntity.ok(balanceCalculationService.getGroupBalances(groupId));
    }

    private GroupDto mapToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .createdBy(group.getCreatedBy().getId())
                .members(group.getMembers().stream()
                        .map(u -> UserDto.builder().id(u.getId()).email(u.getEmail()).name(u.getName()).build())
                        .collect(Collectors.toList()))
                .build();
    }
}
