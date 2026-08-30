package com.kaundega.backend.controller;

import com.kaundega.backend.dto.CreateExpenseRequest;
import com.kaundega.backend.dto.ExpenseDto;
import com.kaundega.backend.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping("/expenses")
    public ResponseEntity<ExpenseDto> createExpense(@RequestBody CreateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(request));
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable UUID expenseId) {
        expenseService.deleteExpense(expenseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/expenses")
    public ResponseEntity<List<ExpenseDto>> getExpenses(@PathVariable UUID groupId,
                                                        @RequestParam(defaultValue = "50") int limit,
                                                        @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(expenseService.getExpenses(groupId, limit, offset));
    }
}
