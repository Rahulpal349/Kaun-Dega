package com.kaundega.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaundega.backend.dto.CreateExpenseRequest;
import com.kaundega.backend.dto.SplitRequest;
import com.kaundega.backend.dto.SplitType;
import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.ExpenseRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private ExpenseRepository expenseRepository;

    private User u1, u2;
    private Group group;

    @BeforeEach
    void setup() {
        u1 = User.builder().email("e1@example.com").password("p").name("U1").build();
        u2 = User.builder().email("e2@example.com").password("p").name("U2").build();
        userRepository.saveAll(List.of(u1, u2));

        group = Group.builder().name("G").createdBy(u1).members(new java.util.ArrayList<>(List.of(u1, u2))).build();
        groupRepository.save(group);
    }

    @Test
    void createExpense_validInput_success() throws Exception {
        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), u1.getId(), new BigDecimal("100"), "Lunch", SplitType.EQUAL, List.of(
                new SplitRequest(u1.getId(), null),
                new SplitRequest(u2.getId(), null)
        ));

        mockMvc.perform(post("/expenses")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(u1)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.amount").value(100));
    }

    @Test
    void deleteExpense_revertsBalances() throws Exception {
        Expense expense = Expense.builder().group(group).paidBy(u1).amount(new BigDecimal("100")).createdAt(LocalDateTime.now()).build();
        expense = expenseRepository.save(expense);

        mockMvc.perform(delete("/expenses/" + expense.getId())
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(u1))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/groups/" + group.getId() + "/expenses")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(u1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getExpenses_paginationWorks() throws Exception {
        Expense expense = Expense.builder().group(group).paidBy(u1).amount(new BigDecimal("100")).createdAt(LocalDateTime.now()).splits(java.util.Collections.emptyList()).build();
        expenseRepository.save(expense);

        mockMvc.perform(get("/groups/" + group.getId() + "/expenses?limit=10&offset=0")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(u1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
