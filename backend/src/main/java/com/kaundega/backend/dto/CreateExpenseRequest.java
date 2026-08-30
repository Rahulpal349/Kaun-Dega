package com.kaundega.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {
    private UUID groupId;
    private UUID paidBy;
    private BigDecimal amount;
    private String description;
    private SplitType splitType;
    private List<SplitRequest> splits;
}
