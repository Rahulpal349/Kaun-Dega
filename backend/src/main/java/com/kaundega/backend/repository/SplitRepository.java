package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Split;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SplitRepository extends JpaRepository<Split, UUID> {
    List<Split> findByExpenseId(UUID expenseId);
    List<Split> findByUserId(UUID userId);
    List<Split> findByExpenseGroupId(UUID groupId);
}
