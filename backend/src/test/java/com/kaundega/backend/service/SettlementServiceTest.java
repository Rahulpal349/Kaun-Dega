package com.kaundega.backend.service;

import com.kaundega.backend.dto.BalanceDetails;
import com.kaundega.backend.dto.SettlementTransaction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private BalanceCalculationService balanceCalculationService;

    @InjectMocks
    private SettlementService settlementService;

    @Test
    void calculateSettlements_twoUsers_success() {
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        Map<UUID, BalanceDetails> balances = Map.of(
                u1, BalanceDetails.builder().netBalance(new BigDecimal("-100")).build(),
                u2, BalanceDetails.builder().netBalance(new BigDecimal("100")).build()
        );
        when(balanceCalculationService.getGroupBalances(groupId)).thenReturn(balances);

        List<SettlementTransaction> settlements = settlementService.calculateSettlements(groupId);
        assertThat(settlements).hasSize(1);
        assertThat(settlements.get(0).getFromUserId()).isEqualTo(u1);
        assertThat(settlements.get(0).getToUserId()).isEqualTo(u2);
        assertThat(settlements.get(0).getAmount()).isEqualByComparingTo("100");
    }

    @Test
    void calculateSettlements_threeUsers_optimizes() {
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        Map<UUID, BalanceDetails> balances = Map.of(
                u1, BalanceDetails.builder().netBalance(new BigDecimal("-100")).build(),
                u2, BalanceDetails.builder().netBalance(new BigDecimal("-200")).build(),
                u3, BalanceDetails.builder().netBalance(new BigDecimal("300")).build()
        );
        when(balanceCalculationService.getGroupBalances(groupId)).thenReturn(balances);

        List<SettlementTransaction> settlements = settlementService.calculateSettlements(groupId);
        assertThat(settlements).hasSize(2);
    }

    @Test
    void calculateSettlements_circular_resolves() {
        // A owes B 100, B owes C 100, C owes A 100.
        // Net balance for everyone is 0.
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        Map<UUID, BalanceDetails> balances = Map.of(
                u1, BalanceDetails.builder().netBalance(BigDecimal.ZERO).build(),
                u2, BalanceDetails.builder().netBalance(BigDecimal.ZERO).build(),
                u3, BalanceDetails.builder().netBalance(BigDecimal.ZERO).build()
        );
        when(balanceCalculationService.getGroupBalances(groupId)).thenReturn(balances);

        List<SettlementTransaction> settlements = settlementService.calculateSettlements(groupId);
        assertThat(settlements).isEmpty(); // Greedy matches zero transactions!
    }
    
    @Test
    void calculateSettlements_noDebt_returnsEmpty() {
        UUID groupId = UUID.randomUUID();
        when(balanceCalculationService.getGroupBalances(groupId)).thenReturn(Map.of());
        
        List<SettlementTransaction> settlements = settlementService.calculateSettlements(groupId);
        assertThat(settlements).isEmpty();
    }
}
