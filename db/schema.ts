import { sqliteTable,text,index } from "drizzle-orm/sqlite-core";
export const records=sqliteTable("records",{id:text("id").primaryKey(),kind:text("kind").notNull(),data:text("data").notNull(),updatedAt:text("updated_at").notNull()},t=>[index("records_kind").on(t.kind)]);
