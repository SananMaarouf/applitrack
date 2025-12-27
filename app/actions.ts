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

    // Validate the transition
    const validationResult = validateStatusTransition(status, newStatus);

    if (!validationResult.isValid) {
      return { success: false, message: validationResult.message };
    }

    // Handle special cases based on transition type
    if (validationResult.transitionType === 'reset') {
      // Reset to Applied (1) - delete all history and ensure no new entry is created
      
      // Update the job application status first
      await db.update(applications)
        .set({ status: newStatus })
        .where(
          and(
            eq(applications.id, id),
            eq(applications.userId, user_id)
          )
        );
      
      // Delete ALL history records for this application (including the one just created by the trigger)
      await db.delete(applicationStatusHistory)
        .where(
          and(
            eq(applicationStatusHistory.applicationId, id),
            eq(applicationStatusHistory.userId, user_id)
          )
        );
    } else if (validationResult.transitionType === 'terminal_switch') {
      // Switching between terminal states - update the last history entry instead of creating new one
      if (historyData && historyData.length > 0) {
        const latestHistory = historyData[0];
        
        // Update the last history entry to point to the new terminal status
        await db.update(applicationStatusHistory)
          .set({ toStatus: newStatus })
          .where(eq(applicationStatusHistory.id, latestHistory.id));
        
        // Update the application status without triggering history creation
        // We need to update it directly since we already updated the history
        await db.update(applications)
          .set({ status: newStatus })
          .where(
            and(
              eq(applications.id, id),
              eq(applications.userId, user_id)
            )
          );
        
        // The trigger will have created a duplicate entry, so we need to delete it
        // Get all history entries again and delete the most recent one (which was just created)
        const updatedHistory = await db.select()
          .from(applicationStatusHistory)
          .where(
            and(
              eq(applicationStatusHistory.applicationId, id),
              eq(applicationStatusHistory.userId, user_id)
            )
          )
          .orderBy(desc(applicationStatusHistory.createdAt));
        
        // If there are multiple entries and the first one is different from what we updated, delete it
        if (updatedHistory.length > 1 && updatedHistory[0].id !== latestHistory.id) {
          await db.delete(applicationStatusHistory)
            .where(eq(applicationStatusHistory.id, updatedHistory[0].id));
        }
      }
    } else if (validationResult.transitionType === 'correction') {
      // Backward transition (correction) - delete the last history record
      if (historyData && historyData.length > 0) {
        const latestHistory = historyData[0];
        await db.delete(applicationStatusHistory)
          .where(eq(applicationStatusHistory.id, latestHistory.id));
      }
      
      // Update the job application status
      await db.update(applications)
        .set({ status: newStatus })
        .where(
          and(
            eq(applications.id, id),
            eq(applications.userId, user_id)
          )
        );
    } else {
      // For 'forward' transitions, the database trigger will handle creating the history entry
      // Update the job application status
      await db.update(applications)
        .set({ status: newStatus })
        .where(
          and(
            eq(applications.id, id),
            eq(applications.userId, user_id)
          )
        );
    }

    // Fetch the updated aggregated status history
    const aggregatedStatusHistoryData = await db.execute(
      sql`SELECT * FROM application_status_flow WHERE user_id = ${user_id}`
    );

    const aggregatedStatusHistory = aggregatedStatusHistoryData.rows as AggregatedStatusHistory[] ?? [];

    // Return success with updated aggregated status history
    return {
      success: true,
      message: validationResult.message,
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
 * Flow rules:
 * - Sequential progression within statuses 1-4: Must go 1→2→3→4 (no skipping)
 * - Direct to terminal: Can jump from any status (1-4) directly to terminal states (5/6/7)
 * - Corrections allowed: Can go backwards to fix mistakes (e.g., 4→3, 3→2, 2→1)
 * - Terminal state switches: Can change between terminal states (5↔6↔7), which updates the last history entry
 * - Reset: Can reset from any status to Applied(1), which clears all history
 * 
 * @param currentStatus - The current status of the job application
 * @param newStatus - The proposed new status
 * @returns Object with validation result, transition type, and message
 */
function validateStatusTransition(
  currentStatus: number,
  newStatus: number
): { isValid: boolean; transitionType: 'forward' | 'correction' | 'terminal_switch' | 'reset' | null; message: string } {
  
  // Validate status range
  if (newStatus < 1 || newStatus > 7) {
    return {
      isValid: false,
      transitionType: null,
      message: "Invalid status value"
    };
  }

  // Same status check (should be caught earlier, but just in case)
  if (currentStatus === newStatus) {
    return {
      isValid: false,
      transitionType: null,
      message: "Status is already set to this value"
    };
  }

  // Reset to Applied from any status
  if (newStatus === 1) {
    return {
      isValid: true,
      transitionType: 'reset',
      message: "Application status reset to Applied (history cleared)"
    };
  }

  // Define terminal statuses
  const terminalStatuses = [5, 6, 7]; // Offer, Rejected, Ghosted
  const isCurrentTerminal = terminalStatuses.includes(currentStatus);
  const isNewTerminal = terminalStatuses.includes(newStatus);

  // Switching between terminal states
  if (isCurrentTerminal && isNewTerminal) {
    return {
      isValid: true,
      transitionType: 'terminal_switch',
      message: "Terminal status updated (corrected in history)"
    };
  }

  // Cannot transition from terminal state to non-terminal (except Applied which is handled above)
  if (isCurrentTerminal && !isNewTerminal) {
    const statusNames: { [key: number]: string } = {
      5: "Offer",
      6: "Rejected",
      7: "Ghosted"
    };
    return {
      isValid: false,
      transitionType: null,
      message: `Cannot change from terminal status "${statusNames[currentStatus]}" to a non-terminal status. Reset to "Applied" first if needed.`
    };
  }

  // For non-terminal statuses (1-4), enforce sequential progression within 1-4, but allow direct jumps to terminal states
  if (currentStatus >= 1 && currentStatus <= 4) {
    const diff = newStatus - currentStatus;

    // Forward transition
    if (diff > 0) {
      // Transitioning to a terminal status (5, 6, 7) - always allowed
      if (isNewTerminal) {
        return {
          isValid: true,
          transitionType: 'forward',
          message: "Status updated successfully"
        };
      }
      
      // Transitioning within non-terminal statuses (1-4) - must be sequential (+1)
      if (diff === 1) {
        return {
          isValid: true,
          transitionType: 'forward',
          message: "Status updated successfully"
        };
      } else {
        // Trying to skip steps within non-terminal statuses
        const statusNames: { [key: number]: string } = {
          1: "Applied",
          2: "Interview",
          3: "Second Interview",
          4: "Third Interview"
        };
        return {
          isValid: false,
          transitionType: null,
          message: `Cannot skip steps. Progress sequentially: "${statusNames[currentStatus]}" → "${statusNames[currentStatus + 1]}"`
        };
      }
    }

    // Backward transition (correction): allowed for fixing mistakes
    if (diff < 0) {
      return {
        isValid: true,
        transitionType: 'correction',
        message: "Status corrected (previous history entry removed)"
      };
    }
  }

  // Default fallback (should not reach here with valid inputs)
  return {
    isValid: false,
    transitionType: null,
    message: "Invalid status transition"
  };
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