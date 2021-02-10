# Remove idle transactions


```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state LIKE 'idle %' 
AND state_change < now() - interval '1 hour';
```

<!--more-->

