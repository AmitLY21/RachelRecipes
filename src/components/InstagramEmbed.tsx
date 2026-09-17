import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

interface InstagramEmbedProps {
  url: string;
  className?: string;
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ url, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  // Clean Instagram URL to standard permalink
  const cleanUrl = React.useMemo(() => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      // Retain /p/CODE/ or /reel/CODE/
      const match = parsed.pathname.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://www.instagram.com/${match[1]}/${match[2]}/`;
      }
      return url.split('?')[0];
    } catch {
      return url;
    }
  }, [url]);

  const loadInstagramSDK = () => {
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
      return;
    }

    // Ensure embed.js script exists
    let script = document.querySelector('script[src*="instagram.com/embed.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.onload = () => {
      setTimeout(() => {
        if (window.instgrm?.Embeds?.process) {
          window.instgrm.Embeds.process();
        }
      }, 200);
    };

    script.onerror = () => {
      setLoadError(true);
    };
  };

  useEffect(() => {
    if (!cleanUrl) return;
    loadInstagramSDK();
  }, [cleanUrl]);

  if (!cleanUrl) {
    return (
      <div className="p-6 text-center text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
        לא הוזן קישור תקין לפוסט באינסטגרם
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center relative ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
        <blockquote
          key={cleanUrl}
          className="instagram-media w-full"
          data-instgrm-captioned
          data-instgrm-permalink={cleanUrl}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: 0,
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
            margin: '0 auto',
            maxWidth: '540px',
            minWidth: '280px',
            padding: 0,
            width: '100%',
          }}
        >
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 shadow-sm">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-bold">
                IG
              </div>
            </div>
            <p className="text-sm font-medium text-stone-700 mb-2">
              טוען תצוגה מקדימה מאינסטגרם...
            </p>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-4"
            >
              פתח פוסט מקורי באינסטגרם <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </blockquote>
      </div>

      {/* Fallback / AdBlock Warning & Direct Link */}
      {loadError && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between w-full max-w-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>התוסף של אינסטגרם נחסם (אולי חוסם פרסומות פועל)</span>
          </div>
          <button
            onClick={() => {
              setLoadError(false);
              loadInstagramSDK();
            }}
            className="p-1 hover:bg-amber-100 rounded text-amber-900 transition-colors"
            title="נסה שוב"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
