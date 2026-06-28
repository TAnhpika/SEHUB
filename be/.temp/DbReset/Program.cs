var connStr = "Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.rvzjghfgchijrzegqkqr;Password=PmIGpDASGxJ0YOFJ;SSL Mode=Require;Trust Server Certificate=true";
await using var conn = new Npgsql.NpgsqlConnection(connStr);
await conn.OpenAsync();
await using var cmd = conn.CreateCommand();
cmd.CommandText = """
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
""";
await cmd.ExecuteNonQueryAsync();
Console.WriteLine("Schema reset OK");
