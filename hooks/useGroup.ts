import { useState, useEffect, useCallback } from 'react';
import { Group, BalanceDetails, SettlementTransaction } from '../lib/types';
import { groupService } from '../lib/groupService';

export const useGroup = (groupId?: string) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const [balances, setBalances] = useState<Record<string, BalanceDetails>>({});
    const [settlements, setSettlements] = useState<SettlementTransaction[]>([]);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await groupService.getGroups();
            setGroups(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGroupDetails = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const [groupData, balanceData, settlementData] = await Promise.all([
                groupService.getGroup(id),
                groupService.getGroupBalances(id),
                groupService.getSettlements(id)
            ]);
            setCurrentGroup(groupData);
            setBalances(balanceData);
            setSettlements(settlementData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch group details');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (groupId) {
            fetchGroupDetails(groupId);
        } else {
            fetchGroups();
        }
    }, [groupId, fetchGroups, fetchGroupDetails]);

    const createGroup = async (name: string) => {
        try {
            const newGroup = await groupService.createGroup({ name });
            setGroups(prev => [...prev, newGroup]);
            return newGroup;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create group');
            throw err;
        }
    };

    return { 
        groups, 
        currentGroup, 
        balances, 
        settlements,
        loading, 
        error, 
        fetchGroups, 
        fetchGroupDetails, 
        createGroup 
    };
};
