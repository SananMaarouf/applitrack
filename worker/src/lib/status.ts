/**
 * Status transition rules, ported verbatim from the FastAPI backend this
 * version replaced (backend/app/routes/applications.py::validate_status_transition,
 * preserved on the `self-host` branch).
 */

export const STATUS_NAMES: Record<number, string> = {
  1: "Applied",
  2: "Interview",
  3: "Second Interview",
  4: "Third Interview",
  5: "Offer",
  6: "Rejected",
  7: "Ghosted",
};

const TERMINAL_STATUSES = new Set([5, 6, 7]);

export type TransitionType = "forward" | "correction" | "reset" | "terminal_switch";

export type TransitionResult = {
  isValid: boolean;
  transitionType: TransitionType | null;
  message: string;
};

export function validateStatusTransition(currentStatus: number, newStatus: number): TransitionResult {
  if (newStatus < 1 || newStatus > 7) {
    return { isValid: false, transitionType: null, message: "Invalid status value" };
  }

  if (currentStatus === newStatus) {
    return { isValid: false, transitionType: null, message: "Status is already set to this value" };
  }

  if (newStatus === 1) {
    return {
      isValid: true,
      transitionType: "reset",
      message: "Application status reset to Applied (history cleared)",
    };
  }

  const isCurrentTerminal = TERMINAL_STATUSES.has(currentStatus);
  const isNewTerminal = TERMINAL_STATUSES.has(newStatus);

  if (isCurrentTerminal && isNewTerminal) {
    return {
      isValid: true,
      transitionType: "terminal_switch",
      message: "Terminal status updated (corrected in history)",
    };
  }

  if (isCurrentTerminal && !isNewTerminal) {
    const name = STATUS_NAMES[currentStatus] ?? "terminal";
    return {
      isValid: false,
      transitionType: null,
      message: `Cannot change from terminal status "${name}" to a non-terminal status. Reset to "Applied" first if needed.`,
    };
  }

  if (currentStatus >= 1 && currentStatus <= 4) {
    const diff = newStatus - currentStatus;

    if (diff > 0) {
      if (isNewTerminal || diff === 1) {
        return { isValid: true, transitionType: "forward", message: "Status updated successfully" };
      }
      const current = STATUS_NAMES[currentStatus];
      const next = STATUS_NAMES[currentStatus + 1];
      return {
        isValid: false,
        transitionType: null,
        message: `Cannot skip steps. Progress sequentially: ${current} → ${next}`,
      };
    }

    if (diff < 0) {
      return {
        isValid: true,
        transitionType: "correction",
        message: "Status corrected (previous history entry removed)",
      };
    }
  }

  return { isValid: false, transitionType: null, message: "Invalid status transition" };
}
