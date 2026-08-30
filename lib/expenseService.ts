import api from './api';
import { Expense, CreateExpenseRequest } from './types';

export const expenseService = {
    getExpenses: async (groupId: string, filters?: { limit?: number; offset?: number }): Promise<Expense[]> => {
        const response = await api.get<Expense[]>(`/groups/${groupId}/expenses`, { params: filters });
        return response.data;
    },

    getExpense: async (id: string): Promise<Expense> => {
        const response = await api.get<Expense>(`/expenses/${id}`);
        return response.data;
    },

    createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
        const response = await api.post<Expense>('/expenses', data);
        return response.data;
    },

    updateExpense: async (id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
        const response = await api.put<Expense>(`/expenses/${id}`, data);
        return response.data;
    },

    deleteExpense: async (id: string): Promise<void> => {
        await api.delete(`/expenses/${id}`);
    }
};
