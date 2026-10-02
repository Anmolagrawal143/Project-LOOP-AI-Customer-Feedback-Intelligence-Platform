import {
  FeedbackChannel,
  FeedbackSentiment,
  FeedbackStatus,
} from "@prisma/client";
import { z } from "zod";

export const feedbackItemSchema = z.object({
  content: z.string().min(1, "Content is required"),
  channel: z.nativeEnum(FeedbackChannel),
  sentiment: z.nativeEnum(FeedbackSentiment),
  status: z.nativeEnum(FeedbackStatus).optional().default(FeedbackStatus.NEW),
});

export const feedbackBulkSchema = z.array(feedbackItemSchema).min(1);

export const feedbackStatusUpdateSchema = z.object({
  status: z.enum([FeedbackStatus.REVIEWED, FeedbackStatus.ACTIONED]),
});

export type FeedbackItemInput = z.infer<typeof feedbackItemSchema>;
