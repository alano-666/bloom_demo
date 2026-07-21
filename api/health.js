module.exports = function health(_request, response) {
  response.status(200).json({
    ok: true,
    runtime: "vercel-node-commonjs",
    storageConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
};
