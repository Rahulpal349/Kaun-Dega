import api from './api';
import { Transaction } from './types';

export const transactionService = {
    recordSettlement: async (data: { groupId: string; toUserId: string; amount: number }): Promise<Transaction> => {
        const response = await api.post<Transaction>('/transactions', data);
        return response.data;
    },

    getTransactionHistory: async (groupId: string): Promise<Transaction[]> => {
        const response = await api.get<Transaction[]>(`/groups/${groupId}/transactions`);
        return response.data;
    }
};
