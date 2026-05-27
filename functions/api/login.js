export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    
    // Check if an ADMIN_PASSWORD environment variable is configured in Cloudflare Dashboard.
    // If not, default to 'admin' for local dev compatibility.
    const securePassword = env.ADMIN_PASSWORD || 'admin';
    
    if (password === securePassword) {
      return new Response(JSON.stringify({ success: true, token: 'mock-token-for-dev' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
