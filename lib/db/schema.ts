  import {
    integer,
    text,
    uuid,
    boolean,
    pgTable,
    timestamp,
  } from "drizzle-orm/pg-core";
  import { relations } from "drizzle-orm";
    
  export const files = pgTable("files", {
    id: uuid("id").primaryKey().defaultRandom(),
    imagekit_file_id: text("imagekit_file_id").notNull(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    size: integer("size").notNull(),
    type: text("type").notNull(),

    fileUrl: text("file_url").notNull(), // url to access the file
    thumbnailUrl: text("thumbnail_url"),

    //ownership :
    user_id: text("user_id").notNull(),
    parent_id: uuid("parent_id"), //parent folder id

    //file folder flags :
    isFolder: boolean("is_folder").default(false).notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    isTrash: boolean("is_trash").default(false).notNull(),

    //craetedAt :
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

  // parent : one file or folder can have most only one parent,
  // children : one folder and files can have multiple files as child

  export const filesRelation = relations(files, ({ one, many }) => ({
    parent: one(files, {
      fields: [files.parent_id],
      references: [files.id],
    }),

    children: many(files),
  }));

  // Type Definations :
  export type File = typeof files.$inferSelect;
  export type NewFile = typeof files.$inferInsert;
