# Spring Boot API Integration

This project has been migrated from a direct Supabase integration to a Spring Boot REST API. All API calls now go through an Axios client with interceptors for JWT token handling.

## Directory Structure

- `lib/api.ts` - Axios instance with request/response interceptors and retry logic.
- `lib/authService.ts` - Login, registration, and user session management.
- `lib/groupService.ts` - Fetching groups, calculating balances, and processing settlements.
- `lib/expenseService.ts` - Recording expenses and viewing history.
- `lib/transactionService.ts` - Managing settlement transactions.
- `lib/types.ts` - TypeScript interfaces mapped to the Java Spring Boot DTOs.
- `hooks/useAuth.ts` - React hook for managing global authentication state.
- `hooks/useGroup.ts` - React hook for viewing groups and balances.
- `hooks/useExpense.ts` - React hook for creating and viewing expenses.

## Environment Variables

Ensure you have a `.env.local` file at the root of your Next.js project with the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## How to use the Hooks

### 1. Authentication
Use `useAuth` to conditionally render components or perform logins:

```tsx
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { login, loading, error } = useAuth();

    const handleLogin = async () => {
        try {
            await login('alice@example.com', 'password123');
            // Redirect to dashboard
        } catch (e) {
            console.error("Login failed!");
        }
    }
}
```

### 2. Group Dashboard & Balances
Use `useGroup` to fetch a specific group and its real-time computed balances:

```tsx
import { useGroup } from '../hooks/useGroup';

export default function GroupDashboard({ groupId }) {
    const { currentGroup, balances, settlements, loading, error } = useGroup(groupId);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>{currentGroup?.name}</h1>
            {/* Render Balances */}
            {Object.entries(balances).map(([userId, balance]) => (
                <div key={userId}>User {userId} net balance: {balance.netBalance}</div>
            ))}
        </div>
    );
}
```

### 3. Adding an Expense
Use `useExpense` to fetch a group's expenses or record a new one:

```tsx
import { useExpense } from '../hooks/useExpense';

export default function ExpenseList({ groupId }) {
    const { expenses, addExpense, loading } = useExpense(groupId);

    const handleAdd = async () => {
        await addExpense({
            groupId,
            paidBy: "user-id-here",
            amount: 100,
            description: "Dinner",
            splits: [
                { userId: "user-id-1", amount: 50 },
                { userId: "user-id-2", amount: 50 }
            ]
        });
    };
    
    // ... render
}
```

## Error Handling & Retries

- **Token Expiry**: The `api.ts` response interceptor will automatically catch `401 Unauthorized` responses and clear the local token, forcing the user back to the login screen.
- **Network Failures**: We use `axios-retry` which automatically retries failed network requests or 5xx server errors up to 3 times using exponential backoff.
- **Hook Errors**: All hooks capture HTTP errors and expose them via the `error` state variable, falling back to the backend's provided `err.response.data.message` when available.
