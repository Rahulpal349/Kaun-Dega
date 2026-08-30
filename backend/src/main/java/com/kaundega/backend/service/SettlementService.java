package com.kaundega.backend.service;

import com.kaundega.backend.dto.BalanceDetails;
import com.kaundega.backend.dto.SettlementTransaction;
import com.kaundega.backend.dto.TransactionDto;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.Transaction;
import com.kaundega.backend.entity.TransactionStatus;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.exception.BusinessValidationException;
import com.kaundega.backend.repository.GroupRepository;
import com.kaundega.backend.repository.TransactionRepository;
import com.kaundega.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class SettlementService {

    private final BalanceCalculationService balanceCalculationService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public SettlementService(BalanceCalculationService balanceCalculationService, 
                             TransactionRepository transactionRepository,
                             UserRepository userRepository,
                             GroupRepository groupRepository) {
        this.balanceCalculationService = balanceCalculationService;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    public List<SettlementTransaction> calculateSettlements(UUID groupId) {
        Map<UUID, BalanceDetails> balances = balanceCalculationService.getGroupBalances(groupId);

        List<UserBalance> debtors = new ArrayList<>();
        List<UserBalance> creditors = new ArrayList<>();

        for (Map.Entry<UUID, BalanceDetails> entry : balances.entrySet()) {
            BigDecimal net = entry.getValue().getNetBalance();
            if (net.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(new UserBalance(entry.getKey(), net.abs())); 
            } else if (net.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(new UserBalance(entry.getKey(), net)); 
            }
        }

        debtors.sort((a, b) -> b.amount.compareTo(a.amount));
        creditors.sort((a, b) -> b.amount.compareTo(a.amount));

        List<SettlementTransaction> settlements = new ArrayList<>();
        int i = 0, j = 0;

        while (i < debtors.size() && j < creditors.size()) {
            UserBalance debtor = debtors.get(i);
            UserBalance creditor = creditors.get(j);

            BigDecimal minAmount = debtor.amount.min(creditor.amount);
            
            if (minAmount.compareTo(BigDecimal.ZERO) > 0) {
                settlements.add(new SettlementTransaction(debtor.userId, creditor.userId, minAmount));
            }

            debtor.amount = debtor.amount.subtract(minAmount);
            creditor.amount = creditor.amount.subtract(minAmount);

            if (debtor.amount.compareTo(new BigDecimal("0.01")) < 0) i++;
            if (creditor.amount.compareTo(new BigDecimal("0.01")) < 0) j++;
        }

        return settlements;
    }

    @Transactional
    public TransactionDto recordSettlement(UUID fromUserId, UUID toUserId, BigDecimal amount, UUID groupId) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Settlement amount must be positive");
        }

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new BusinessValidationException("From user not found"));
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new BusinessValidationException("To user not found"));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessValidationException("Group not found"));

        Transaction transaction = Transaction.builder()
                .group(group)
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(amount)
                .status(TransactionStatus.COMPLETED)
                .build();

        Transaction saved = transactionRepository.save(transaction);
        
        return TransactionDto.builder()
                .id(saved.getId())
                .groupId(group.getId())
                .fromUser(fromUser.getId())
                .toUser(toUser.getId())
                .amount(saved.getAmount())
                .status(saved.getStatus())
                .build();
    }

    private static class UserBalance {
        UUID userId;
        BigDecimal amount;

        UserBalance(UUID userId, BigDecimal amount) {
            this.userId = userId;
            this.amount = amount;
        }
    }
}
