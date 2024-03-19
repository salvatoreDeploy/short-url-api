import postgres from "postgres";

export const sql = postgres('postgresql://postgres:docker@localhost:5432/api-short-url')