import { z } from "zod";

export const decisionSchema = z.object({
  action: z.enum(["create_thread", "comment"]),
  communitySlug: z.string().min(1),
  threadId: z.string().optional(),
  title: z.string().optional(),
  body: z.string().min(1),
});

export type Decision = z.infer<typeof decisionSchema>;
