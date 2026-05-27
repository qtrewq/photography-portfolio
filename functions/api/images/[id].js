export async function onRequestGet({ env, params }) {
  try {
    const id = params.id;
    const dataUrl = await env.PORTFOLIO_KV.get(id);
    
    if (!dataUrl) {
      return new Response('Image not found', { status: 404 });
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return new Response('Invalid image data', { status: 500 });
    }

    const mimeType = match[1];
    const b64Data = match[2];
    const binary = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));

    return new Response(binary, {
      status: 200,
      headers: { 
        'Content-Type': mimeType, 
        'Cache-Control': 'public, max-age=31536000' 
      }
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
