---
title: "PostgreSQL - Import / export CSV"
date: 2020-04-15T11:06:08+02:00
featuredImage: "https://www.virtual-dba.com/media/postgresql-database-services-remote-dba.png"
tags: ["postgresql"]
categories: ["post"]
---

Export:

```sql
\copy (SELECT * FROM your_table)
TO '/tmp/your_table.csv' CSV HEADER FORCE QUOTE *;
```

Import:

```sql
\copy your_table FROM '/tmp/your_table.csv' CSV HEADER;
```

<!--more-->

