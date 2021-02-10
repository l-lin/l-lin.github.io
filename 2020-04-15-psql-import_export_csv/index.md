# PostgreSQL - Import / export CSV


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


