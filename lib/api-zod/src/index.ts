export * from "./generated/api";
export * from "./generated/types";

// Request-body names exist both as Zod schemas (generated/api) and as plain
// TypeScript types (generated/types). Re-export the Zod schemas explicitly so
// the name is unambiguous; use `z.infer<typeof X>` when you need the type.
export {
  CreateEventAssetBody,
  CreateEventBody,
  CreateEventNoteBody,
  CreateOrganizationBody,
  CreateProfileBody,
  UpdateEventAssetBody,
  UpdateEventBody,
  UpdateEventTaskBody,
  UpdateProfileBody,
  UpdateSettingsBody,
} from "./generated/api";
