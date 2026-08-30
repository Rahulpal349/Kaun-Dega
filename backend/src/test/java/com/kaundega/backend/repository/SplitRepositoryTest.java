package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.Split;
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
class SplitRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SplitRepository splitRepository;

    @Test
    void shouldFindByUserId() {
        User u1 = User.builder().password("password").email("u1@example.com").name("U1").build();
        User u2 = User.builder().password("password").email("u2@example.com").name("U2").build();
        entityManager.persist(u1);
        entityManager.persist(u2);

        Group group = Group.builder().name("G").createdBy(u1).build();
        entityManager.persist(group);

        Expense expense = Expense.builder().group(group).paidBy(u1).amount(new BigDecimal("100")).createdAt(LocalDateTime.now()).build();
        entityManager.persist(expense);

        Split split = Split.builder().expense(expense).user(u2).amount(new BigDecimal("50")).build();
        entityManager.persist(split);
        entityManager.flush();

        List<Split> splits = splitRepository.findByUserId(u2.getId());
        assertThat(splits).hasSize(1);
        assertThat(splits.get(0).getAmount()).isEqualByComparingTo("50");
    }
}
