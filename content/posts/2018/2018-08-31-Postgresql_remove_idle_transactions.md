---
title: "Remove idle transactions"
date: 2018-08-31T16:10:12+02:00
featuredImage: ""
tags: ["postgresql"]
categories: ["post"]
---

```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state LIKE 'idle %' 
AND state_change < now() - interval '1 hour';
```

<!--more-->
