package com.kaundega.backend.service;

import com.kaundega.backend.dto.*;
import com.kaundega.backend.entity.*;
import com.kaundega.backend.exception.BusinessValidationException;
import com.kaundega.backend.repository.*;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    public ExpenseService(ExpenseRepository expenseRepository, GroupRepository groupRepository, UserRepository userRepository, CacheManager cacheManager) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.cacheManager = cacheManager;
    }

    @Transactional
    @CacheEvict(value = "groupBalances", key = "#result.groupId")
    public ExpenseDto createExpense(CreateExpenseRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Expense amount must be greater than zero");
        }

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new BusinessValidationException("Group not found"));

        User paidBy = userRepository.findById(request.getPaidBy())
                .orElseThrow(() -> new BusinessValidationException("Paid by user not found"));

        if (group.getMembers() == null || !group.getMembers().contains(paidBy)) {
            throw new BusinessValidationException("Paid by user is not in the group");
        }

        List<Split> splits = calculateSplits(request);

        Expense expense = Expense.builder()
                .group(group)
                .paidBy(paidBy)
                .amount(request.getAmount())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build();
        
        for (Split split : splits) {
            split.setExpense(expense);
        }
        expense.setSplits(splits);
        
        Expense saved = expenseRepository.save(expense);
        return mapToDto(saved);
    }

    private List<Split> calculateSplits(CreateExpenseRequest request) {
        List<Split> splits = new ArrayList<>();
        BigDecimal totalAmount = request.getAmount();
        List<SplitRequest> splitRequests = request.getSplits();

        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new BusinessValidationException("Splits cannot be empty");
        }

        BigDecimal calculatedSum = BigDecimal.ZERO;

        if (request.getSplitType() == SplitType.EQUAL) {
            int numPeople = splitRequests.size();
            BigDecimal equalAmount = totalAmount.divide(new BigDecimal(numPeople), 2, RoundingMode.HALF_UP);
            
            for (int i = 0; i < numPeople; i++) {
                BigDecimal amount = equalAmount;
                if (i == 0) {
                    BigDecimal totalCalculated = equalAmount.multiply(new BigDecimal(numPeople));
                    BigDecimal remainder = totalAmount.subtract(totalCalculated);
                    amount = amount.add(remainder);
                }
                calculatedSum = calculatedSum.add(amount);
                splits.add(createSplit(splitRequests.get(i).getUserId(), amount));
            }
        } else if (request.getSplitType() == SplitType.CUSTOM) {
            for (SplitRequest sr : splitRequests) {
                if (sr.getValue() == null || sr.getValue().compareTo(BigDecimal.ZERO) < 0) {
                    throw new BusinessValidationException("Custom split value must be >= 0");
                }
                calculatedSum = calculatedSum.add(sr.getValue());
                splits.add(createSplit(sr.getUserId(), sr.getValue()));
            }
            if (calculatedSum.compareTo(totalAmount) != 0) {
                throw new BusinessValidationException("Custom splits sum (" + calculatedSum + ") does not match total amount (" + totalAmount + ")");
            }
        } else if (request.getSplitType() == SplitType.PERCENTAGE) {
            BigDecimal totalPercentage = BigDecimal.ZERO;
            for (int i = 0; i < splitRequests.size(); i++) {
                SplitRequest sr = splitRequests.get(i);
                if (sr.getValue() == null || sr.getValue().compareTo(BigDecimal.ZERO) < 0) {
                    throw new BusinessValidationException("Percentage split value must be >= 0");
                }
                totalPercentage = totalPercentage.add(sr.getValue());
                
                BigDecimal amount = totalAmount.multiply(sr.getValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                calculatedSum = calculatedSum.add(amount);
                splits.add(createSplit(sr.getUserId(), amount));
            }
            
            if (totalPercentage.compareTo(new BigDecimal("100")) != 0) {
                throw new BusinessValidationException("Total percentage must equal 100");
            }
            
            if (calculatedSum.compareTo(totalAmount) != 0) {
                BigDecimal remainder = totalAmount.subtract(calculatedSum);
                splits.get(0).setAmount(splits.get(0).getAmount().add(remainder));
            }
        }

        return splits;
    }

    private Split createSplit(UUID userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessValidationException("User not found: " + userId));
        return Split.builder().user(user).amount(amount).build();
    }

    @Transactional
    public void deleteExpense(UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new BusinessValidationException("Expense not found"));
        UUID groupId = expense.getGroup().getId();
        expenseRepository.delete(expense);
        
        if (cacheManager.getCache("groupBalances") != null) {
            cacheManager.getCache("groupBalances").evict(groupId);
        }
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpenses(UUID groupId, int limit, int offset) {
        List<Expense> allExpenses = expenseRepository.findByGroupId(groupId);
        return allExpenses.stream()
                .skip(offset)
                .limit(limit)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ExpenseDto mapToDto(Expense e) {
        List<SplitDto> splitDtos = e.getSplits().stream()
                .map(s -> SplitDto.builder()
                        .id(s.getId())
                        .expenseId(e.getId())
                        .userId(s.getUser().getId())
                        .amount(s.getAmount())
                        .build())
                .collect(Collectors.toList());

        return ExpenseDto.builder()
                .id(e.getId())
                .groupId(e.getGroup().getId())
                .paidBy(e.getPaidBy().getId())
                .amount(e.getAmount())
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .splits(splitDtos)
                .build();
    }
}
