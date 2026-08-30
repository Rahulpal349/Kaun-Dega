export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    profilePicture?: string;
    createdAt: string;
}

export interface Group {
    id: string;
    name: string;
    createdBy: string;
    createdAt: string;
    members: User[];
}

export interface Split {
    id: string;
    expenseId: string;
    userId: string;
    amount: number;
}

export interface Expense {
    id: string;
    groupId: string;
    paidBy: string;
    amount: number;
    description: string;
    date: string;
    createdAt: string;
    splits: Split[];
}

export interface CreateExpenseRequest {
    groupId: string;
    paidBy: string;
    amount: number;
    description: string;
    splits: CreateSplitRequest[];
}

export interface CreateSplitRequest {
    userId: string;
    amount: number;
}

export interface BalanceDetails {
    totalPaid: number;
    totalShare: number;
    netBalance: number;
}

export interface SettlementTransaction {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export interface Transaction {
    id: string;
    fromUser: string;
    toUser: string;
    groupId: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
