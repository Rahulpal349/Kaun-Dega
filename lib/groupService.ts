import api from './api';
import { Group, BalanceDetails, SettlementTransaction } from './types';

export const groupService = {
    getGroups: async (): Promise<Group[]> => {
        const response = await api.get<Group[]>('/groups');
        return response.data;
    },

    getGroup: async (id: string): Promise<Group> => {
        const response = await api.get<Group>(`/groups/${id}`);
        return response.data;
    },

    createGroup: async (data: { name: string }): Promise<Group> => {
        const response = await api.post<Group>('/groups', data);
        return response.data;
    },

    updateGroup: async (id: string, data: { name: string }): Promise<Group> => {
        const response = await api.put<Group>(`/groups/${id}`, data);
        return response.data;
    },

    addMember: async (groupId: string, email: string): Promise<Group> => {
        const response = await api.post<Group>(`/groups/${groupId}/members`, { email });
        return response.data;
    },

    removeMember: async (groupId: string, userId: string): Promise<Group> => {
        const response = await api.delete<Group>(`/groups/${groupId}/members/${userId}`);
        return response.data;
    },

    getGroupBalances: async (groupId: string): Promise<Record<string, BalanceDetails>> => {
        const response = await api.get<Record<string, BalanceDetails>>(`/groups/${groupId}/balances`);
        return response.data;
    },

    getSettlements: async (groupId: string): Promise<SettlementTransaction[]> => {
        const response = await api.get<SettlementTransaction[]>(`/groups/${groupId}/settlements`);
        return response.data;
    }
};
