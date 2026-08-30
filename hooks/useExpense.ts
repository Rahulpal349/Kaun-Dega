import { useState, useCallback } from 'react';
import { Expense, CreateExpenseRequest } from '../lib/types';
import { expenseService } from '../lib/expenseService';

export const useExpense = (groupId: string) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await expenseService.getExpenses(groupId);
            setExpenses(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const addExpense = async (data: CreateExpenseRequest) => {
        setLoading(true);
        setError(null);
        try {
            const newExpense = await expenseService.createExpense(data);
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create expense');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeExpense = async (expenseId: string) => {
        setLoading(true);
        setError(null);
        try {
            await expenseService.deleteExpense(expenseId);
            setExpenses(prev => prev.filter(e => e.id !== expenseId));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete expense');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        expenses,
        loading,
        error,
        fetchExpenses,
        addExpense,
        removeExpense
    };
};
