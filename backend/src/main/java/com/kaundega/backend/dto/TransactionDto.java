package com.kaundega.backend.dto;

import com.kaundega.backend.entity.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private UUID id;
    private UUID groupId;
    private UUID fromUser;
    private UUID toUser;
    private BigDecimal amount;
    private TransactionStatus status;
}
