"use server";

import { db } from "@/db";
import { applications, applicationStatusHistory } from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";
import type { DeleteAccountState } from "@/types/accountStates";

export const changePasswordAction = async (formData: FormData) => {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      message: "User not authenticated"
    };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Check if user has a password (not OAuth-only)
    const hasPassword = user.passwordEnabled;
    
    if (!hasPassword) {
      return {
        success: false,
        message: "Password change is not available for accounts using social login (Google, etc.). Your account is managed through your social provider."
      };
    }

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      return {
        success: false,
        message: "Password and confirm password are required"
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match"
      };
    }

    await client.users.updateUser(userId, {
      password: password,
    });

    return {
      success: true,
      message: "Password updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: "Password update failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

export const saveJobApplicationAction = async (formData: FormData) => {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, message: "User not authenticated" };
  }

  // Get the form data
  const position = formData.get("position")?.toString();
  const company = formData.get("company")?.toString();
  const applied_at = formData.get("applied_at")?.toString();
  const expires_at = formData.get("expires_at")?.toString();
  const link = formData.get("link")?.toString();

  if (!position || !company || !applied_at) {
    return { success: false, message: "Position, company, and date applied are required" };
  }

  try {
    const data = await db.insert(applications).values({
      userId: userId,
      position,
      company,
      status: 1,
      link: link || null,
      appliedAt: new Date(applied_at),
      expiresAt: expires_at ? new Date(expires_at) : null,
    }).returning();

    // Transform database response to match JobApplication type
    const transformedData = data.map(app => ({
      id: app.id,
      created_at: app.createdAt.toISOString(),
      user_id: app.userId,
      applied_at: app.appliedAt.toISOString(),
      expires_at: app.expiresAt?.toISOString(),
      position: app.position,
      company: app.company,
      status: app.status,
      link: app.link || undefined,
    }));

    return { success: true, message: "Job application saved successfully", data: transformedData };
  } catch (error) {
    console.error("Error saving job application:", error);
    return { success: false, message: "Could not save job application" };
  }
};

export const deleteApplication = async (id: string, user_id: string) => {
  const { userId } = await auth();
  
  if (!userId || userId !== user_id) {
    return { success: false, message: "Unauthorized" };
  }

  if (!id || !user_id) {
    return { success: false, message: "Job application ID and user ID are required" };
  }

  try {
    await db.delete(applications)
      .where(and(eq(applications.id, parseInt(id)), eq(applications.userId, user_id)));

    // Fetch the updated status history using raw SQL for the view
    const aggregatedStatusHistoryData = await db.execute(
      sql`SELECT * FROM application_status_flow WHERE user_id = ${user_id}`
    );

    const aggregatedStatusHistory = aggregatedStatusHistoryData.rows as AggregatedStatusHistory[] ?? [];

    return {
      success: true,
      message: "Job application deleted successfully",
      aggregatedStatusHistory
    };
  } catch (error) {
    console.error("Error deleting application:", error);
    return { success: false, message: "Could not delete job application" };
  }
};

export const updateApplication = async (jobApplication: JobApplication, newStatus: number) => {
  const { userId } = await auth();
  
  if (!userId || userId !== jobApplication.user_id) {
    return { success: false, message: "Unauthorized" };
  }

  const { id, user_id, status } = jobApplication;

  // Validate input
  if (!id || !user_id || !newStatus) {
    return { success: false, message: `Missing required fields: ${!id ? "Job Application ID" : ""}${!user_id ? " User ID" : ""}${!newStatus ? " New Status" : ""}`.trim() };
  }

  // Check if the new status is different from the current status
  if (status === newStatus) {
    return { success: false, message: `New status (${newStatus}) is the same as the current status (${status})` };
  }

  try {
    // Fetch job application status history
    const historyData = await db.select()
      .from(applicationStatusHistory)
      .where(
        and(
          eq(applicationStatusHistory.applicationId, id),
          eq(applicationStatusHistory.userId, user_id)
        )
      )
      .orderBy(desc(applicationStatusHistory.createdAt));

    // Check if the transition is valid
    const isValidTransition = validateStatusTransition(status, newStatus);

    // If newStatus is 1, delete all history records for this application
    if (newStatus === 1 && historyData && historyData.length > 0) {
      await db.delete(applicationStatusHistory)
        .where(
          and(
            eq(applicationStatusHistory.applicationId, id),
            eq(applicationStatusHistory.userId, user_id)
          )
        );
    }
    // If transition is invalid, delete the last history record
    else if (!isValidTransition && historyData && historyData.length > 0) {
      const latestHistory = historyData[0];

      await db.delete(applicationStatusHistory)
        .where(eq(applicationStatusHistory.id, latestHistory.id));
    }

    // Update the job application status
    // This will trigger the database function to create a new history entry
    await db.update(applications)
      .set({ status: newStatus })
      .where(
        and(
          eq(applications.id, id),
          eq(applications.userId, user_id)
        )
      );

    // Fetch the updated aggregated status history
    const aggregatedStatusHistoryData = await db.execute(
      sql`SELECT * FROM application_status_flow WHERE user_id = ${user_id}`
    );

    const aggregatedStatusHistory = aggregatedStatusHistoryData.rows as AggregatedStatusHistory[] ?? [];

    // Return success with updated aggregated status history
    return {
      success: true,
      message: isValidTransition
        ? "Job application status updated successfully"
        : (newStatus === 1
          ? "Job application status reset to Applied (history cleared)"
          : "Job application status updated (history corrected)"),
      aggregatedStatusHistory
    };

  } catch (error) {
    console.error("Error updating application status:", error);
    return { success: false, message: "An unexpected error occurred while updating the status" };
  }
};

/**
 * Validates if a status transition is valid based on application flow rules.
 * 
 * @param currentStatus - The current status of the job application
 * @param newStatus - The proposed new status
 * @returns boolean - Whether the transition is valid
 */
function validateStatusTransition(currentStatus: number, newStatus: number): boolean {
  // No change or invalid status
  if (currentStatus === newStatus || newStatus < 1 || newStatus > 7) {
    return false;
  }

  // Final states cannot be updated (Offer, Rejected, Ghosted)
  if (currentStatus === 5 || currentStatus === 6 || currentStatus === 7) {
    return false;
  }

  // For statuses 1-4, ensure the new status is higher
  if (currentStatus >= 1 && currentStatus <= 4) {
    // If trying to move backward in the process
    if (newStatus < currentStatus) {
      return false;
    }

    // All forward transitions are valid
    return true;
  }

  // Default case (should not happen with proper input validation)
  return false;
}


export const deleteAccountAction = async (
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> => {
  const formUserId = formData.get("user_id")?.toString();
  const { userId } = await auth();

  if (!userId || !formUserId || userId !== formUserId) {
    return { status: "error", message: "Unauthorized" };
  }

  try {
    // Step 1: Delete all user data from database
    // Delete status history first (though cascade should handle this)
    await db.delete(applicationStatusHistory)
      .where(eq(applicationStatusHistory.userId, userId));

    // Delete applications
    await db.delete(applications)
      .where(eq(applications.userId, userId));

    // Step 2: Verify deletion by querying again
    const remainingApplications = await db.select()
      .from(applications)
      .where(eq(applications.userId, userId));

    const remainingHistory = await db.select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.userId, userId));

    if (remainingApplications.length > 0 || remainingHistory.length > 0) {
      console.error(`Failed to delete all user data. Remaining: ${remainingApplications.length} applications, ${remainingHistory.length} history records`);
      return { status: "error", message: "Failed to delete user data from database" };
    }

    // Step 3: Delete user from Clerk
    const client = await clerkClient();
    await client.users.deleteUser(userId);
      
    return { status: "success", message: "Account deleted successfully" };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { status: "error", message: "Could not delete account" };
  }
};