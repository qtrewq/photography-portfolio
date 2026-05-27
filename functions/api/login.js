export async function onRequestPost({ request }) {
  try {
    const { password } = await request.json();
    
    // In a real app, use a secure hashed password stored in KV or Env vars.
    // For this demonstration, we use a hardcoded password 'admin'
    if (password === 'admin') {
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
