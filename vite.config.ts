import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function instagramExtractorPlugin(): Plugin {
  return {
    name: 'instagram-extractor',
    configureServer(server) {
      server.middlewares.use('/api/instagram-extract', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://127.0.0.1:5173');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url query parameter' }));
            return;
          }

          // Clean Instagram URL to standard permalink
          let cleanUrl = targetUrl;
          try {
            const parsed = new URL(targetUrl);
            const match = parsed.pathname.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
            if (match) {
              cleanUrl = `https://www.instagram.com/${match[1]}/${match[2]}/`;
            }
          } catch {
            // keep targetUrl as fallback
          }

          const igResponse = await fetch(cleanUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1;line-poker/1.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'he,en;q=0.9',
            },
          });

          const html = await igResponse.text();

          // Extract og:image
          const ogImgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
          let imageUrl = ogImgMatch ? ogImgMatch[1] : '';

          // Extract og:title
          const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
          let rawTitle = ogTitleMatch ? ogTitleMatch[1] : '';

          // Decode HTML entities
          const decodeEntities = (str: string) => {
            return str
              .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
              .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&apos;/g, "'");
          };

          imageUrl = decodeEntities(imageUrl);
          rawTitle = decodeEntities(rawTitle);

          // Clean caption: Strip `Author on Instagram / באינסטגרם: "..."`
          let caption = rawTitle;
          const cleanCaption = rawTitle
            .replace(/^[\s\S]*?(?:on Instagram|באינסטגרם)[^":״]*[:\s]*["״]/i, '')
            .replace(/["״][^"]*$/, '')
            .trim();

          if (cleanCaption && cleanCaption !== rawTitle) {
            caption = cleanCaption;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              success: true,
              imageUrl,
              caption,
              cleanUrl,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Failed to extract Instagram metadata' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL || './',
  plugins: [react(), tailwindcss(), instagramExtractorPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
