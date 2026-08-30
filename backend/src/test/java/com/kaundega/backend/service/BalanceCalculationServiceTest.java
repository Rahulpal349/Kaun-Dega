package com.kaundega.backend.service;

import com.kaundega.backend.dto.BalanceDetails;
import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.Split;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.ExpenseRepository;
import com.kaundega.backend.repository.GroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceCalculationServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private BalanceCalculationService balanceService;

    private User u1, u2, u3;
    private Group group;

    @BeforeEach
    void setup() {
        u1 = User.builder().password("password").id(UUID.randomUUID()).name("Alice").build();
        u2 = User.builder().password("password").id(UUID.randomUUID()).name("Bob").build();
        u3 = User.builder().password("password").id(UUID.randomUUID()).name("Charlie").build();
        group = Group.builder().id(UUID.randomUUID()).members(List.of(u1, u2, u3)).build();
    }

    @Test
    void calculateGroupBalances_singleExpense_success() {
        Expense expense = Expense.builder()
                .group(group).paidBy(u1).amount(new BigDecimal("120"))
                .splits(List.of(
                        Split.builder().user(u1).amount(new BigDecimal("40")).build(),
                        Split.builder().user(u2).amount(new BigDecimal("40")).build(),
                        Split.builder().user(u3).amount(new BigDecimal("40")).build()
                )).build();

        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(expenseRepository.findByGroupId(group.getId())).thenReturn(List.of(expense));

        Map<UUID, BalanceDetails> balances = balanceService.getGroupBalances(group.getId());

        assertThat(balances.get(u1.getId()).getNetBalance()).isEqualByComparingTo("80");
        assertThat(balances.get(u2.getId()).getNetBalance()).isEqualByComparingTo("-40");
        assertThat(balances.get(u3.getId()).getNetBalance()).isEqualByComparingTo("-40");
    }

    @Test
    void calculateGroupBalances_multipleExpenses_success() {
        Expense e1 = Expense.builder()
                .group(group).paidBy(u1).amount(new BigDecimal("100"))
                .splits(List.of(Split.builder().user(u2).amount(new BigDecimal("100")).build())).build();
        Expense e2 = Expense.builder()
                .group(group).paidBy(u2).amount(new BigDecimal("50"))
                .splits(List.of(Split.builder().user(u1).amount(new BigDecimal("50")).build())).build();

        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(expenseRepository.findByGroupId(group.getId())).thenReturn(List.of(e1, e2));

        Map<UUID, BalanceDetails> balances = balanceService.getGroupBalances(group.getId());

        assertThat(balances.get(u1.getId()).getNetBalance()).isEqualByComparingTo("50");
        assertThat(balances.get(u2.getId()).getNetBalance()).isEqualByComparingTo("-50");
    }

    @Test
    void calculateUserBalance_owesAndReceives() {
        Expense e1 = Expense.builder().paidBy(u1).splits(List.of(Split.builder().user(u2).amount(new BigDecimal("50")).build())).build();
        Expense e2 = Expense.builder().paidBy(u2).splits(List.of(Split.builder().user(u1).amount(new BigDecimal("20")).build())).build();

        when(expenseRepository.findByGroupId(group.getId())).thenReturn(List.of(e1, e2));

        BigDecimal u2OwesU1 = balanceService.getBalanceBetweenUsers(u2.getId(), u1.getId(), group.getId());
        assertThat(u2OwesU1).isEqualByComparingTo("30"); 
    }
    
    @Test
    void calculateGroupBalances_noExpenses_returnsZeroes() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(expenseRepository.findByGroupId(group.getId())).thenReturn(List.of());

        Map<UUID, BalanceDetails> balances = balanceService.getGroupBalances(group.getId());

        assertThat(balances.get(u1.getId()).getNetBalance()).isEqualByComparingTo("0");
    }
}
