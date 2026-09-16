# WGM Video

WGM Video is a minimal remote MCP server for Claude that calls fal.ai server-side.

## Deploy
1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Add `FAL_KEY` in Vercel Project Settings → Environment Variables.
4. Add `WGM_OAUTH_SECRET` as a long random value.
5. Deploy.
6. Use `https://YOUR-DOMAIN.vercel.app/api/mcp` as Claude's custom connector URL.

## Important
This starter keeps the fal key server-side. Do not prefix it with `NEXT_PUBLIC_`.

## What is included
- WGM Video landing page
- `/api/health`
- remote MCP endpoint `/api/mcp`
- generation, polling and convenience generation tools
- server-side fal.ai credentials
- cost safety cap

## Next phase
For a public multi-user product, add OAuth 2.1 + PKCE and a persistent database for users, jobs and usage. For a personal/private Claude connector, deploy it behind an access-controlled environment or add OAuth before sharing the URL publicly.
