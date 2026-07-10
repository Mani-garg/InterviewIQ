import { prisma } from "@/lib/prisma";

export type ActivityType =
  | "resume_uploaded"
  | "interview_generated"
  | "interview_completed"
  | "goal_created"
  | "goal_updated"
  | "goal_deleted"
  | "interview_scheduled"
  | "interview_schedule_cancelled";

/**
 * Records a real activity feed entry for a user. Best-effort: a logging
 * failure should never break the primary action (uploading a resume,
 * generating an interview, etc.), so callers should not await this in a way
 * that blocks their response — fire it and swallow errors.
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  message: string
) {
  try {
    await prisma.activityEvent.create({
      data: { userId, type, message }
    });
  } catch (err) {
    console.error("Failed to record activity event:", err);
  }
}