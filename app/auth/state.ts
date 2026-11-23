export type AuthState = { status: "idle" | "error" | "success"; message: string; errors?: Partial<Record<string, string>> };
export const initialAuthState: AuthState = { status: "idle", message: "" };
