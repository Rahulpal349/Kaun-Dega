package com.kaundega.backend.repository;

import com.kaundega.backend.entity.Transaction;
import com.kaundega.backend.entity.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByGroupIdAndStatus(UUID groupId, TransactionStatus status);
    List<Transaction> findByFromUserIdOrToUserId(UUID fromUserId, UUID toUserId);
}
