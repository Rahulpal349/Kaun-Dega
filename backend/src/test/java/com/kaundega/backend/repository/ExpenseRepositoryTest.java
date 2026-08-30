package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ExpenseRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Test
    void shouldSumByGroupId() {
        User user = User.builder().password("password").email("u@example.com").name("U").build();
        entityManager.persist(user);

        Group group = Group.builder().name("G").createdBy(user).build();
        entityManager.persist(group);

        Expense e1 = Expense.builder().group(group).paidBy(user).amount(new BigDecimal("100.50")).createdAt(LocalDateTime.now()).build();
        Expense e2 = Expense.builder().group(group).paidBy(user).amount(new BigDecimal("50.00")).createdAt(LocalDateTime.now()).build();
        entityManager.persist(e1);
        entityManager.persist(e2);
        entityManager.flush();

        BigDecimal sum = expenseRepository.sumByGroupId(group.getId());
        assertThat(sum).isEqualByComparingTo("150.50");
    }
}
