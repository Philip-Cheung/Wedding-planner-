export function ConfigRequired() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <h1 className="text-xl font-semibold mb-2">Configuration required</h1>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        Supabase environment variables are missing. Add them in your Vercel project:
      </p>
      <ol className="list-decimal list-inside text-sm text-left space-y-2 mb-6">
        <li>Open your Vercel project → Settings → Environment Variables</li>
        <li>Add <code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code> (your Supabase project URL)</li>
        <li>Add <code className="bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code> (your Supabase anon key)</li>
        <li>Redeploy the project</li>
      </ol>
      <p className="text-xs text-muted-foreground">
        Get these values from your Supabase project dashboard → Settings → API
      </p>
    </div>
  )
}
