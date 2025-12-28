"use server";

import { db } from "@/db";
import { applications, applicationStatusHistory } from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
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
