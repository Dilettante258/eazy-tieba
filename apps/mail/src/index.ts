import { renderExportMail, subjectForExportMail } from "./templates";
import { exportMailEventSchema } from "./types";

interface MailEnv {
	EMAIL: SendEmail;
	MAIL_SERVICE_TOKEN: string;
	MAIL_FROM: string;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}

function isAuthorized(request: Request, env: MailEnv): boolean {
	const auth = request.headers.get("authorization");
	if (!auth?.startsWith("Bearer ")) return false;
	return auth.slice("Bearer ".length).trim() === env.MAIL_SERVICE_TOKEN;
}

export default {
	async fetch(request: Request, env: MailEnv): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/health") {
			return jsonResponse({
				status: "ok",
				service: "mail",
				timestamp: new Date().toISOString(),
			});
		}

		if (
			request.method !== "POST" ||
			url.pathname !== "/internal/export-events"
		) {
			return jsonResponse({ message: "not found" }, 404);
		}

		if (!isAuthorized(request, env)) {
			return jsonResponse({ message: "unauthorized" }, 401);
		}

		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return jsonResponse({ message: "invalid json" }, 400);
		}

		const parsed = exportMailEventSchema.safeParse(body);
		if (!parsed.success) {
			return jsonResponse(
				{
					message: "invalid payload",
					issues: parsed.error.issues,
				},
				400,
			);
		}

		const event = parsed.data;
		if (!env.MAIL_FROM?.trim()) {
			console.error("MAIL_FROM is not configured");
			return jsonResponse({ message: "mail from is not configured" }, 500);
		}

		if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
			console.error("EMAIL binding is not configured");
			return jsonResponse({ message: "email binding is not configured" }, 500);
		}

		try {
			const { html, text } = renderExportMail(event);
			await env.EMAIL.send({
				from: env.MAIL_FROM,
				to: event.recipients,
				subject: subjectForExportMail(event),
				html,
				text,
			});
		} catch (error) {
			console.error("Failed to render or send export mail", {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				eventType: event.eventType,
				recipients: event.recipients,
				mailFrom: env.MAIL_FROM,
				hasEmailBinding: !!env.EMAIL,
			});
			return jsonResponse(
				{
					message: "failed to send mail",
					error: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}

		return jsonResponse({
			ok: true,
			eventType: event.eventType,
			recipients: event.recipients,
		});
	},
} satisfies ExportedHandler<MailEnv>;
