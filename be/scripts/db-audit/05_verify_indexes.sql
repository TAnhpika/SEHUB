-- List public indexes after migrations (compare with EF model snapshot).

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
