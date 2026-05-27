export async function onRequestGet({ env }) {
  try {
    const data = await env.PORTFOLIO_KV.get('portfolio_data');
    
    // Parse the data if it exists
    let parsedData = null;
    if (data) {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        parsedData = null;
      }
    }
    
    // If no data exists, or it uses the old legacy blocks system, reset to blank slate slides structure
    const hasSlidesSystem = parsedData && parsedData.pages && parsedData.pages.every(p => Array.isArray(p.slides));
    
    if (!hasSlidesSystem) {
      const defaultData = {
        settings: { 
          title: "Aqueous Portfolio", 
          bio: "Capturing the world through a widescreen lens.",
          typography: "serif",
          navigationLayout: "top",
          footerText: "© 2026 Aqueous Portfolio. Created with Widescreen Slides."
        },
        theme: "classicDark",
        pages: [
          { 
            id: "landscape", 
            title: "Landscape", 
            slides: [
              {
                id: "s_default_1",
                background: {
                  type: "color",
                  value: "#121212",
                  image: null
                },
                transition: "fade",
                blocks: [
                  {
                    id: "b_title_text",
                    type: "text",
                    content: "# AQUEOUS PORTFOLIO\n\n##### BY JUSTIN GALLAGHER\n\n*A widescreen horizontal photography experience inspired by cinematic projections.*",
                    x: 260, y: 350, width: 1400, height: 400, zIndex: 1
                  }
                ]
              },
              {
                id: "s_default_2",
                background: {
                  type: "color",
                  value: "#1a1a1a",
                  image: null
                },
                transition: "slide",
                blocks: [
                  {
                    id: "b_about_text",
                    type: "text",
                    content: "## The Widescreen Gallery\n\nThis portfolio is designed like a Google Slides presentation, allowing you to compose full-bleed visual narratives. \n\nDouble click any box in the editor to modify text or replace photos. You can drag and resize elements freely with active snap-guidelines.",
                    x: 100, y: 150, width: 600, height: 780, zIndex: 1
                  },
                  {
                    id: "b_hero_photo",
                    type: "photo",
                    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&width=1200&auto=format&fit=crop",
                    caption: "Yosemite Valley at Dusk",
                    objectFit: "cover",
                    x: 750, y: 150, width: 1070, height: 780, zIndex: 2
                  }
                ]
              }
            ]
          },
          { 
            id: "portrait", 
            title: "Portrait", 
            slides: [
              {
                id: "s_portrait_1",
                background: {
                  type: "color",
                  value: "#0f172a",
                  image: null
                },
                transition: "zoom",
                blocks: [
                  {
                    id: "b_port_title",
                    type: "text",
                    content: "# PORTRAITURE\n\n*Studying shadows, countenances, and human expressions.*",
                    x: 100, y: 150, width: 800, height: 300, zIndex: 1
                  },
                  {
                    id: "b_port_hero",
                    type: "photo",
                    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=1200&auto=format&fit=crop",
                    caption: "Golden hour reflections",
                    objectFit: "cover",
                    x: 100, y: 500, width: 1720, height: 480, zIndex: 2
                  }
                ]
              }
            ]
          }
        ]
      };
      
      // Update KV directly to overwrite any corrupt data
      await env.PORTFOLIO_KV.put('portfolio_data', JSON.stringify(defaultData));
      
      return new Response(JSON.stringify(defaultData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(parsedData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();
    // Validate JSON format
    JSON.parse(body);
    
    await env.PORTFOLIO_KV.put('portfolio_data', body);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
