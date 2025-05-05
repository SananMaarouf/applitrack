"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/auth",
      "Email and password are required",
    );
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
    return encodedRedirect("error", "/auth", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/auth",
      "Thanks for signing up! Please check your email for a verification link. If you don't see it, check your spam folder.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  /* 
    signInWithPassword, if successfull, returns a JWT session token and user object.
    session is stored in a cookie in the browser and user is available in the client.
  */
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/auth", error.message);
  }

  return redirect("/dashboard");
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

  encodedRedirect("success", "/dashboard/reset-password", "Password updated");
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
    return { success: false, message: "Job application ID and user ID are required"};
  }

  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    return { success: false, message: "Could not fetch job application" };
  }

  return { success: true, message: "Job application deleted successfully", data };
};

export const updateApplication = async (id: string, user_id: string, status: number) => {
  const supabase = await createClient();

  if (!id || !user_id) {
    return { success: false, message: "Job application ID and user ID are required"};
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) {
    return { success: false, message: "Could not fetch job application" };
  }
  console.log(data);

  return { success: true, message: "Job application updated successfully", data };
}

export const deleteAccountAction = async (user_id: string) => {
  // Regular client for user operations
  const supabase = await createAdminClient();
  
  if (!user_id) {
    return encodedRedirect("error", "/dashboard/settings", "User ID is required");
  }

  console.log("Deleting account for user ID:", user_id);

  // The delete cascade should handle deleting applications
  // but we'll keep the explicit delete for clarity
  const { error: applicationsError } = await supabase
    .from("applications")
    .delete()
    .eq("user_id", user_id);

  if (applicationsError) {
    console.error("Error deleting applications:", applicationsError);
    return encodedRedirect("error", "/dashboard/settings", "Could not delete account data");
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