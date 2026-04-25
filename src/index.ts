import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "~/auth";

// Auth guard macro plugin — resolves user/session from Better Auth
const authGuard = new Elysia({ name: "auth-guard" }).macro({
	auth: {
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({
				headers,
			});

			if (!session) {
				return status(401, "Unauthorized");
			}

			return {
				user: session.user,
				session: session.session,
			};
		},
	},
});

const app = new Elysia()
	.use(
		cors({
			origin: "http://localhost:3001",
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.mount("/auth", auth.handler)
	.use(authGuard)
	.group("/api", (app) =>
		app
			// Public routes — no auth required
			.get("/health", () => ({ status: "ok" }))
			// Protected routes — require authentication
			.get("/me", ({ user }) => user, {
				auth: true,
			}),
	)
	.get("/", () => "Eat your vegetables 🥦")
	.listen(process.env.PORT ?? 3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
