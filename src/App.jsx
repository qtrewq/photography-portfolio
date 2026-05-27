import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import PageView from './components/PageView';
// Footer removed — slides fill the full viewport
import AdminEditor from './components/AdminEditor';
import './App.css';

function App() {
  const [pages, setPages] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ 
    title: "Portfolio", 
    bio: "",
    typography: "sans",
    navigationLayout: "top",
    footerText: "© 2026 Portfolio"
  });
  const [loading, setLoading] = useState(true);

  // Fallback mock data
  useEffect(() => {
    // In production this fetches from /api/portfolio
    const fetchPortfolioData = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const data = await res.json();
          const defaultSettings = { 
            title: "Portfolio", 
            bio: "",
            typography: "sans",
            navigationLayout: "top",
            footerText: "© 2026 Portfolio"
          };
          setSiteSettings({ ...defaultSettings, ...(data.settings || {}) });
          setPages(data.pages || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch from API, using mock data for development.");
      }
      
      const mockData = {
        settings: { 
          title: "Aqueous Photography", 
          bio: "Capturing the world through a lens.",
          typography: "sans",
          navigationLayout: "top",
          footerText: "© 2026 Photography Portfolio"
        },
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
                    content: "# AQUEOUS PORTFOLIO\n\n##### BY JUSTIN GALLAGHER\n\n*A widescreen horizontal photography experience.*",
                    x: 260, y: 350, width: 1400, height: 400, zIndex: 1
                  }
                ]
              }
            ]
          }
        ]
      };
      
      setSiteSettings(mockData.settings);
      setPages(mockData.pages || []);
      setLoading(false);
    };

    fetchPortfolioData();
  }, []);

  useEffect(() => {
    if (siteSettings.typography === 'serif') {
      document.body.style.fontFamily = "'Playfair Display', serif";
    } else if (siteSettings.typography === 'mono') {
      document.body.style.fontFamily = "'Space Mono', monospace";
    } else {
      document.body.style.fontFamily = "'Outfit', sans-serif";
    }
  }, [siteSettings.typography]);

  if (loading) return <div className="loading fade-in">Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Admin gets its own full-screen context, no nav/footer */}
        <Route path="/admin" element={<AdminEditor />} />

        {/* All other routes get the standard site shell */}
        <Route path="/*" element={
          <div className={`app-container layout-${siteSettings.navigationLayout}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Navigation pages={pages} title={siteSettings.title} layout={siteSettings.navigationLayout} />
            <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <Routes>
                <Route path="/" element={<Navigate to={pages.length > 0 ? `/${pages[0].id}` : "/"} replace />} />
                {pages.map((page) => (
                  <Route 
                    key={page.id} 
                    path={`/${page.id}`} 
                    element={<PageView page={page} siteSettings={siteSettings} />} 
                  />
                ))}
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
