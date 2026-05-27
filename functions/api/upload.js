export async function onRequestPost({ request, env }) {
  try {
    const { dataUrl } = await request.json();
    if (!dataUrl) return new Response('Missing dataUrl', { status: 400 });

    const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    await env.PORTFOLIO_KV.put(id, dataUrl);
    
    return new Response(JSON.stringify({ url: `/api/images/${id}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
