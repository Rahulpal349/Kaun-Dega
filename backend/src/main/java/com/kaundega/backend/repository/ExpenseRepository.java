package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Expense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    @EntityGraph(attributePaths = {"splits", "paidBy"})
    List<Expense> findByGroupId(UUID groupId);
    List<Expense> findByPaidByIdAndGroupId(UUID userId, UUID groupId);
    List<Expense> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.group.id = :groupId")
    BigDecimal sumByGroupId(@Param("groupId") UUID groupId);
}
