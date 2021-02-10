---
title: "How to link old and new IDs when migrating data from one table to another"
date: 2018-03-29T11:25:34+02:00
featuredImage: "https://www.virtual-dba.com/media/postgresql-database-services-remote-dba.png"
tags: ["postgresql"]
categories: ["post"]
---

When proceeding a database migration, I often had to create a temporary table that will contains 
the data from the old database.

However, after the migration, I still need to have links between the old IDs and the new IDs for
various post migration operation.

This post is about creating the table containing the linked ids.

<!--more-->

Imagine we have the following:

```sql
CREATE TABLE old_table (
  id int4,
  name VARCHAR
);
INSERT INTO old_table (id, name) VALUES (3, 'foo');
INSERT INTO old_table (id, name) VALUES (4, 'bar');
INSERT INTO old_table (id, name) VALUES (6, 'foobar');
INSERT INTO old_table (id, name) VALUES (10, 'foo bar');
```

I want to migrate to this new table:

```sql
CREATE TABLE new_table (
  id serial PRIMARY KEY,
  new_name VARCHAR
);
```

With some CTE magic, I should be able to get my temp table that contains the links:

```sql
WITH sel AS (
  SELECT *, row_number() OVER (ORDER BY id) AS rn
  FROM old_table
  ORDER BY id
),
ins AS (
  INSERT INTO new_table (new_name)
  SELECT name
  FROM old_table
  ORDER BY id -- Optional, just to be sure
  RETURNING id
)
SELECT i.id AS new_id, sel.id AS old_id
FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM ins) i
JOIN sel USING (rn);
```

And VOILA, this SQL query will return the link between the old and new IDs.

Check this [sqlfiddle](http://sqlfiddle.com/#!17/2b8d8/1).

Source: [Stackoverflow](https://stackoverflow.com/questions/29256888/insert-into-from-select-returning-id-mappings)

