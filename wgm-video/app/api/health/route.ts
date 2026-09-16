export async function GET() {
  return Response.json({
    ok: true,
    service: "WGM Video",
    mcp: "/api/mcp",
    falConfigured: Boolean(process.env.FAL_KEY),
  });
}