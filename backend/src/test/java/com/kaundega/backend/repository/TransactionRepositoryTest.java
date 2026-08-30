package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.Transaction;
import com.kaundega.backend.entity.TransactionStatus;
import com.kaundega.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TransactionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void shouldFindByGroupIdAndStatus() {
        User u1 = User.builder().password("password").email("t1@example.com").name("T1").build();
        User u2 = User.builder().password("password").email("t2@example.com").name("T2").build();
        entityManager.persist(u1);
        entityManager.persist(u2);

        Group group = Group.builder().name("TG").createdBy(u1).build();
        entityManager.persist(group);

        Transaction tx = Transaction.builder()
                .group(group)
                .fromUser(u1)
                .toUser(u2)
                .amount(new BigDecimal("20"))
                .status(TransactionStatus.PENDING)
                .build();
        entityManager.persist(tx);
        entityManager.flush();

        List<Transaction> txs = transactionRepository.findByGroupIdAndStatus(group.getId(), TransactionStatus.PENDING);
        assertThat(txs).hasSize(1);
    }
}
