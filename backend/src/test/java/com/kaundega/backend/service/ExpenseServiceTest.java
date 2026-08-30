package com.kaundega.backend.service;

import com.kaundega.backend.dto.*;
import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.exception.BusinessValidationException;
import com.kaundega.backend.repository.ExpenseRepository;
import com.kaundega.backend.repository.GroupRepository;
import com.kaundega.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private org.springframework.cache.CacheManager cacheManager;

    @InjectMocks
    private ExpenseService expenseService;

    private User u1, u2;
    private Group group;

    @BeforeEach
    void setup() {
        u1 = User.builder().password("password").id(UUID.randomUUID()).name("U1").build();
        u2 = User.builder().password("password").id(UUID.randomUUID()).name("U2").build();
        group = Group.builder().id(UUID.randomUUID()).members(List.of(u1, u2)).build();
    }

    @Test
    void createExpense_validInput_success() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(userRepository.findById(u1.getId())).thenReturn(Optional.of(u1));
        when(userRepository.findById(u2.getId())).thenReturn(Optional.of(u2));
        when(expenseRepository.save(any())).thenAnswer(i -> {
            Expense e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), u1.getId(), new BigDecimal("100"), "Lunch", SplitType.EQUAL, List.of(
                new SplitRequest(u1.getId(), null),
                new SplitRequest(u2.getId(), null)
        ));

        ExpenseDto res = expenseService.createExpense(req);
        
        assertThat(res).isNotNull();
        assertThat(res.getSplits()).hasSize(2);
        assertThat(res.getSplits().get(0).getAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    void createExpense_invalidSplits_throwsException() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(userRepository.findById(u1.getId())).thenReturn(Optional.of(u1));

        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), u1.getId(), new BigDecimal("100"), "Lunch", SplitType.CUSTOM, List.of(
                new SplitRequest(u1.getId(), new BigDecimal("30")),
                new SplitRequest(u2.getId(), new BigDecimal("50")) // Sum = 80 != 100
        ));

        assertThrows(BusinessValidationException.class, () -> expenseService.createExpense(req));
    }

    @Test
    void createExpense_userNotInGroup_throwsException() {
        User outsider = User.builder().password("password").id(UUID.randomUUID()).name("Outsider").build();
        
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(userRepository.findById(outsider.getId())).thenReturn(Optional.of(outsider));

        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), outsider.getId(), new BigDecimal("100"), "Lunch", SplitType.EQUAL, List.of());

        assertThrows(BusinessValidationException.class, () -> expenseService.createExpense(req));
    }
    
    @Test
    void createExpense_percentageSplit_success() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(userRepository.findById(u1.getId())).thenReturn(Optional.of(u1));
        when(userRepository.findById(u2.getId())).thenReturn(Optional.of(u2));
        when(expenseRepository.save(any())).thenAnswer(i -> {
            Expense e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), u1.getId(), new BigDecimal("200"), "Dinner", SplitType.PERCENTAGE, List.of(
                new SplitRequest(u1.getId(), new BigDecimal("25")), // 25% = 50
                new SplitRequest(u2.getId(), new BigDecimal("75"))  // 75% = 150
        ));

        ExpenseDto res = expenseService.createExpense(req);
        assertThat(res.getSplits().get(0).getAmount()).isEqualByComparingTo("50");
        assertThat(res.getSplits().get(1).getAmount()).isEqualByComparingTo("150");
    }

    @Test
    void createExpense_zeroAmount_throwsException() {
        CreateExpenseRequest req = new CreateExpenseRequest(group.getId(), u1.getId(), BigDecimal.ZERO, "Lunch", SplitType.EQUAL, List.of());
        assertThrows(BusinessValidationException.class, () -> expenseService.createExpense(req));
    }

    @Test
    void deleteExpense_revertsBalances() {
        Expense expense = Expense.builder().id(UUID.randomUUID()).group(group).build();
        when(expenseRepository.findById(expense.getId())).thenReturn(Optional.of(expense));
        
        expenseService.deleteExpense(expense.getId());
        
        verify(expenseRepository, times(1)).delete(expense);
    }
}
