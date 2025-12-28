
export type DeleteAccountState = {
  status: "idle" | "success" | "error";
  message?: string;
};