import { createContext } from "react";

import type { AuthContextValue } from "@/lib/auth/types";

export const AuthContext = createContext<AuthContextValue | null>(null);
