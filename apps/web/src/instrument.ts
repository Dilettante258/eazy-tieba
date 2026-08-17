import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		debug: import.meta.env.DEV,
		dsn: import.meta.env.VITE_SENTRY_DSN,
		release: __APP_VERSION__,
		environment: import.meta.env.MODE,
		integrations: [Sentry.httpClientIntegration()],
		tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
		tracePropagationTargets: [
			"localhost",
			/^https:\/\/zwrcjbwbskoa\.sealosbja\.site/,
			/^https:\/\/cf\.eztb\.org/,
		],
		enableLogs: true,
		dataCollection: {
			userInfo: true,
			cookies: false,
			httpHeaders: { request: false, response: false },
			httpBodies: [],
			urlQueryParams: false,
			graphQL: { document: false, variables: false },
			genAI: { inputs: false, outputs: false },
			databaseQueryData: false,
			stackFrameVariables: false,
		},
		beforeSendTransaction(event) {
			event.spans = event.spans?.filter(
				(span) => !span.op?.startsWith("resource."),
			);
			return event;
		},
	});

	Sentry.getGlobalScope().setAttributes({
		"app.name": "eztb",
		"app.version": __APP_VERSION__,
	});
}
