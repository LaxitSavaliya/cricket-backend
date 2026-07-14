import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

type DatabaseTable = {
  table_name: string;
};

const quoteIdentifier = (identifier: string): string =>
  `"${identifier.replaceAll('"', '""')}"`;

const cleanDatabase = async (): Promise<void> => {
  if (
    process.env["NODE_ENV"] === "production" &&
    process.env["ALLOW_DB_CLEAN"] !== "true"
  ) {
    throw new Error(
      "Database cleaning is blocked in production. " +
        "Set ALLOW_DB_CLEAN=true only when deletion is intentional.",
    );
  }

  const client = await pool.connect();

  try {
    console.log("Cleaning database...");

    await client.query("BEGIN");

    const result = await client.query<DatabaseTable>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      await client.query("COMMIT");
      console.log("No application tables found to clean.");
      return;
    }

    const tableNames = result.rows
      .map(
        ({ table_name }) =>
          `${quoteIdentifier("public")}.${quoteIdentifier(table_name)}`,
      )
      .join(", ");

    await client.query(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    );

    await client.query("COMMIT");

    console.log(
      `Database cleaned successfully. ${result.rows.length} tables emptied.`,
    );
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
};

const main = async (): Promise<void> => {
  try {
    await cleanDatabase();
  } finally {
    await pool.end();
  }
};

main().catch((error: unknown) => {
  console.error(
    "Database cleaning failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
