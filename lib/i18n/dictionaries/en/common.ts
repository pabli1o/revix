import type { CommonDict } from "../fr/common";

export const common: CommonDict = {
  close: "Close",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
  back: "Back",
  delete: "Delete",
  deleting: "Deleting…",
  confirm: "Confirm",
  loading: "Loading…",
  genericError: "Something went wrong. Try again in a moment.",
  retry: "Try again",
  network: {
    connectionFailed: "Couldn't reach the server. Check your internet connection.",
    serverTimeout: "The server took too long to respond (timed out). Try again, maybe with less content at once.",
    payloadTooLarge:
      "What you sent is too large for the server. Remove one or more sources (photos especially), or split them across several notes.",
    invalidResponse: (status: number) => `Invalid response from the server (code ${status}).`,
  },
};
