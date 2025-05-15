"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";


export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !confirmPassword) {
    return {
      success: false,
      error: "Email, password, and password confirmation are required"
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match"
    };
  }

  // Check password strength requirements
  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 8 characters long"
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return {
      success: false,
      error: error.message
    };
  } else {
    return {
      success: true,
      message: "Thanks for signing up! Please check your email for a verification link. If you don't see it, check your spam folder."
    };
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required"
    };
  }

  /* 
    signInWithPassword, if successful, returns a JWT session token and user object.
    session is stored in a cookie in the browser and user is available in the client.
  */
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message
    };
  }

  return {
    success: true,
    message: "Signed in successfully",
    data: {
      user: data.user,
      redirectUrl: "/dashboard"
    }
  };
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/dashboard/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password. If you don't see it, check your spam folder.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/dashboard", "");
};

export const changePasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
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

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return {
      success: false,
      message: "Password update failed",
      error: error.message
    };
  }

  return {
    success: true,
    message: "Password updated successfully"
  };
};


export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

export const saveJobApplicationAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Get the form data
  const user_id = formData.get("user_id")?.toString();
  const position = formData.get("position")?.toString();
  const company = formData.get("company")?.toString();
  const applied_at = formData.get("applied_at")?.toString();
  const expires_at = formData.get("expires_at")?.toString();
  const link = formData.get("link")?.toString();
  const status = formData.get("status")?.toString();

  if (!position || !company || !applied_at || !status) {
    return { success: false, message: "Position, company, date applied, and status are required" };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id,
      position,
      company,
      status: 1,
      link,
      applied_at,
      expires_at,
    })
    .select(); // Use .select() to return the inserted row(s)

  if (error) {
    console.error(error.message);
    return { success: false, message: "Could not save job application" };
  }

  // Return the inserted row(s)
  return { success: true, message: "Job application saved successfully", data };
};

export const deleteApplication = async (id: string, user_id: string) => {
  const supabase = await createClient();

  if (!id || !user_id) {
    return { success: false, message: "Job application ID and user ID are required" };
  }

  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    return { success: false, message: "Could not delete job application" };
  }

  // After deleting the application, fetch the updated status history
  // to ensure the Sankey Digram on dashboard page reflects the latest data
  const { data: aggregatedStatusHistoryData, error: aggError } = await supabase
    .from("application_status_flow")
    .select("*")
    .eq("user_id", user_id);

  if (aggError) {
    return { success: false, message: "Deleted application, but failed to fetch updated status history." };
  }

  const aggregatedStatusHistory = (aggregatedStatusHistoryData ?? []) as AggregatedStatusHistory[];

  return {
    success: true,
    message: "Job application deleted successfully",
    data,
    aggregatedStatusHistory
  };
};

export const updateApplication = async (jobApplication: JobApplication, newStatus: number) => {
  const supabase = await createClient();

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
    const { data: historyData, error: historyError } = await supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", id)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching status history:", historyError);
    }

    // Check if the transition is valid
    const isValidTransition = validateStatusTransition(status, newStatus);

    // If newStatus is 1, delete all history records for this application
    if (newStatus === 1 && historyData && historyData.length > 0) {
      const { error: deleteAllError } = await supabase
        .from("application_status_history")
        .delete()
        .eq("application_id", id)
        .eq("user_id", user_id);

      if (deleteAllError) {
        console.error("Error deleting all history records:", deleteAllError);
        return { success: false, message: "Could not reset status history" };
      }
    }
    // If transition is invalid, delete the last history record
    else if (!isValidTransition && historyData && historyData.length > 0) {
      const latestHistory = historyData[0];

      // Delete the most recent history entry
      const { error: deleteError } = await supabase
        .from("application_status_history")
        .delete()
        .eq("id", latestHistory.id);

      if (deleteError) {
        console.error("Error deleting history record:", deleteError);
        return { success: false, message: "Could not update status history" };
      }
    }

    // Update the job application status regardless of validation result
    // This will trigger the database function to create a new history entry
    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user_id);

    if (updateError) {
      return { success: false, message: "Could not update job application status" };
    }

    // Fetch the updated aggregated status history
    const { data: aggregatedStatusHistoryData, error: aggError } = await supabase
      .from("application_status_flow")
      .select("*")
      .eq("user_id", user_id);

    if (aggError) {
      return {
        success: true,
        message: isValidTransition
          ? "Job application status updated, but failed to fetch updated status history."
          : (newStatus === 1
            ? "Job application status reset to Applied (history cleared), but failed to fetch updated status history."
            : "Job application status updated (history corrected), but failed to fetch updated status history."),
        aggregatedStatusHistory: []
      };
    }

    const aggregatedStatusHistory = (aggregatedStatusHistoryData ?? []) as AggregatedStatusHistory[];

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

export const deleteAccountAction = async (user_id: string) => {
  // Regular client for user operations
  const supabase = await createAdminClient();

  if (!user_id) {
    return encodedRedirect("error", "/dashboard/settings", "User ID is required");
  }

  // Use the admin client to delete the user with service role permissions
  const { error: authError } = await supabase.auth.admin.deleteUser(user_id);

  if (authError) {
    console.error("Error deleting auth user:", authError);
    return encodedRedirect("error", "/dashboard/settings", "Could not delete account");
  }

  // Sign the user out
  await supabase.auth.signOut();

  // Redirect to home page with success message
  return encodedRedirect("success", "/", "Account deleted successfully");
};