export default function health(_request: any, response: any) {
  response.status(200).json({
    ok: true,
    runtime: "vercel-node",
    storageConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
