package com.kaundega.backend.service;

import com.kaundega.backend.dto.BalanceDetails;
import com.kaundega.backend.entity.Expense;
import com.kaundega.backend.entity.Group;
import com.kaundega.backend.entity.Split;
import com.kaundega.backend.entity.User;
import com.kaundega.backend.repository.ExpenseRepository;
import com.kaundega.backend.repository.GroupRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class BalanceCalculationService {

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;

    public BalanceCalculationService(ExpenseRepository expenseRepository, GroupRepository groupRepository) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
    }

    @Cacheable(value = "groupBalances", key = "#groupId")
    public Map<UUID, BalanceDetails> getGroupBalances(UUID groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        List<Expense> expenses = expenseRepository.findByGroupId(groupId);
        
        Map<UUID, BalanceDetails.BalanceDetailsBuilder> builders = new HashMap<>();
        for (User member : group.getMembers()) {
            builders.put(member.getId(), BalanceDetails.builder()
                    .totalPaid(BigDecimal.ZERO)
                    .totalOwed(BigDecimal.ZERO)
                    .netBalance(BigDecimal.ZERO)
                    .owes(new ArrayList<>())
                    .receives(new ArrayList<>()));
        }

        for (Expense expense : expenses) {
            UUID paidById = expense.getPaidBy().getId();
            BalanceDetails.BalanceDetailsBuilder paidByBuilder = builders.get(paidById);
            if (paidByBuilder != null) {
                paidByBuilder.totalPaid(paidByBuilder.build().getTotalPaid().add(expense.getAmount()));
            }

            for (Split split : expense.getSplits()) {
                UUID splitUserId = split.getUser().getId();
                BalanceDetails.BalanceDetailsBuilder splitUserBuilder = builders.get(splitUserId);
                if (splitUserBuilder != null) {
                    splitUserBuilder.totalOwed(splitUserBuilder.build().getTotalOwed().add(split.getAmount()));
                }
            }
        }

        Map<UUID, BalanceDetails> result = new HashMap<>();
        for (Map.Entry<UUID, BalanceDetails.BalanceDetailsBuilder> entry : builders.entrySet()) {
            BalanceDetails details = entry.getValue().build();
            details.setNetBalance(details.getTotalPaid().subtract(details.getTotalOwed()));
            result.put(entry.getKey(), details);
        }
        
        return result;
    }

    public BigDecimal getBalanceBetweenUsers(UUID userId1, UUID userId2, UUID groupId) {
        List<Expense> expenses = expenseRepository.findByGroupId(groupId);
        BigDecimal user1OwesUser2 = BigDecimal.ZERO;
        BigDecimal user2OwesUser1 = BigDecimal.ZERO;

        for (Expense expense : expenses) {
            if (expense.getPaidBy().getId().equals(userId2)) {
                for (Split split : expense.getSplits()) {
                    if (split.getUser().getId().equals(userId1)) {
                        user1OwesUser2 = user1OwesUser2.add(split.getAmount());
                    }
                }
            } else if (expense.getPaidBy().getId().equals(userId1)) {
                for (Split split : expense.getSplits()) {
                    if (split.getUser().getId().equals(userId2)) {
                        user2OwesUser1 = user2OwesUser1.add(split.getAmount());
                    }
                }
            }
        }

        return user1OwesUser2.subtract(user2OwesUser1);
    }
}
