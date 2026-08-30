package com.kaundega.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceDetails {
    private BigDecimal totalPaid;
    private BigDecimal totalOwed;
    private BigDecimal netBalance;
    private List<Debt> owes;
    private List<Debt> receives;
}
