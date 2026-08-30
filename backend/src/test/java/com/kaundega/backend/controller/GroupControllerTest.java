package com.kaundega.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaundega.backend.dto.AddMemberRequest;
import com.kaundega.backend.dto.CreateGroupRequest;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.GroupRepository;
import com.kaundega.backend.repository.UserRepository;
import com.kaundega.backend.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GroupRepository groupRepository;

    private User creator;
    private User member2;

    @BeforeEach
    void setup() {
        creator = User.builder().email("c@example.com").password("p").name("C").build();
        member2 = User.builder().email("m2@example.com").password("p").name("M2").build();
        userRepository.saveAll(List.of(creator, member2));
    }

    @Test
    void createGroup_validInput_success() throws Exception {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("Trip");

        mockMvc.perform(post("/groups")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(creator)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Trip"));
    }

    @Test
    void addMember_validEmail_success() throws Exception {
        Group group = Group.builder().name("Trip").createdBy(creator).members(new java.util.ArrayList<>(List.of(creator))).build();
        group = groupRepository.save(group);

        AddMemberRequest request = new AddMemberRequest();
        request.setEmail(member2.getEmail());

        mockMvc.perform(post("/groups/" + group.getId() + "/members")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(creator)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members.length()").value(2));
    }

    @Test
    void getGroupBalances_calculatesCorrectly() throws Exception {
        Group group = Group.builder().name("Trip").createdBy(creator).members(new java.util.ArrayList<>(List.of(creator))).build();
        group = groupRepository.save(group);

        mockMvc.perform(get("/groups/" + group.getId() + "/balances")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(creator))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$." + creator.getId() + ".netBalance").value(0));
    }
}
