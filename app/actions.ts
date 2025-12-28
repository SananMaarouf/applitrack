/**
 * DEPRECATED: This file has been split into separate action modules for better organization.
 * 
 * Please import from the new locations:
 * - Account/Auth actions: @/app/actions/account/actions
 * - Job Application actions: @/app/actions/applications/actions
 */

// Re-export all actions for backward compatibility
export { changePasswordAction, deleteAccountAction } from './actions/account/actions';
export { saveJobApplicationAction, deleteApplication, bulkDeleteApplications, updateApplication } from './actions/applications/actions';