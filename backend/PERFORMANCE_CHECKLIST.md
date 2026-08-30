# Spring Boot Performance Checklist

This checklist documents the optimizations implemented to resolve N+1 queries, manage connection pooling, improve pagination, and introduce caching.

## 1. Database Indexes
I have created a SQL script that adds indexes to your most queried foreign keys and columns (e.g. `group_id`, `user_id`, `created_at`, `status`). 

**Action Required**:
Please run the `database/02_performance_indexes.sql` script against your production PostgreSQL database.

## 2. N+1 Query Resolution
- **Groups**: `GroupRepository.findByCreatedById` and `findByMembersContains` now use `@EntityGraph` to eagerly fetch members in a single `JOIN FETCH` query.
- **Transactions**: `TransactionRepository` now eagerly fetches `fromUser` and `toUser` during lookups.

## 3. Database-Level Pagination (Critical Fix)
- **Before**: `ExpenseService.getExpenses` loaded *all* expenses for a group into memory and used Java Streams `.skip().limit()` to paginate. This causes memory leaks for large groups.
- **After**: I refactored it to use Spring Data's `PageRequest`, executing `LIMIT` and `OFFSET` directly in PostgreSQL.

## 4. Caching Strategy
- Added **Caffeine** cache to `pom.xml`.
- Created `CacheConfig.java` to set a global Time-To-Live (TTL) of 30 minutes and a maximum size of 500 entries to prevent memory exhaustion.
- `BalanceCalculationService.getGroupBalances` is fully cached and automatically evicts when an expense is created or deleted.

## 5. Connection Pooling & Actuator
- Configured HikariCP in `application-prod.properties` with a max pool size of 20, max lifetime of 30 minutes, and idle timeout of 10 minutes. 
- Enabled **Spring Boot Actuator** metrics at `/actuator/metrics` and `/actuator/prometheus` for Grafana monitoring.

## Next Steps
Run your tests locally to verify the changes:
```bash
mvn clean test
```
