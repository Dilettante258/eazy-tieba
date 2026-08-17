const TOKEN_KEY = "eztb-db-analyze-token";

export const DB_ANALYZE_AUTH_EXPIRED_EVENT = "db-analyze-auth-expired";

export function getDbAnalyzeToken(): string | null {
	try {
		return sessionStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setDbAnalyzeToken(token: string): void {
	try {
		sessionStorage.setItem(TOKEN_KEY, token);
	} catch {
		// Storage may be unavailable in privacy-restricted browser contexts.
	}
}

export function clearDbAnalyzeToken(): void {
	try {
		sessionStorage.removeItem(TOKEN_KEY);
	} catch {
		// Storage may be unavailable in privacy-restricted browser contexts.
	}
}
