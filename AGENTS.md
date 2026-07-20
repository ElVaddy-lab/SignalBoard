# SignalBoard Working Agreement

These instructions apply to the entire repository.

## Development workflow

- Make requested changes locally and verify them in proportion to their risk.
- After each completed batch of changes, start or restart the local development server with `pnpm dev` and provide the local URL so the user can test the result.
- Start the development server with external network access enabled. Server actions must be able to reach the hosted Supabase Auth API, while the browser must be able to load Cloudflare Turnstile.
- Keep the local server running while waiting for the user's feedback unless it must be stopped for troubleshooting or another required task.
- Treat the user's local review as an approval gate before publishing changes.

## Git and deployment policy

- Do not deploy to Vercel automatically after fixes or feature changes.
- Deploy only when the user explicitly asks for a deployment.
- Do not push to GitHub automatically unless the user explicitly asks for a push or confirms that the reviewed batch is ready to publish.
- Local commits may be created only when they are useful for the requested workflow; never interpret a request for code changes as permission to deploy.
- Before an explicitly requested deployment, run the relevant verification suite and report any blockers.

## Project conventions

- The default interface language is English; Ukrainian is optional and selected by the user.
- Preserve existing Supabase migrations, policies, and user data unless a requested change explicitly requires modifying them.
- Do not add dependencies when the existing stack can implement the requested behavior cleanly.
