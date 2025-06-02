/**
 * Configurações de cabeçalhos HTTP para melhorar a performance e segurança do tema ProPlayNews
 * 
 * Este arquivo pode ser usado com servidores como Nginx, Apache ou serviços de hospedagem
 * que permitem personalizar cabeçalhos HTTP.
 */

module.exports = {
  // Cabeçalhos para arquivos estáticos (imagens, CSS, JS)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  },
  
  // Cabeçalhos para fontes
  fonts: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
  },
  
  // Cabeçalhos para páginas HTML
  html: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com *.googleapis.com *.gstatic.com *.doubleclick.net *.facebook.net *.twitter.com platform.twitter.com *.googlesyndication.com *.googleadservices.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' data: blob: *.google-analytics.com *.googletagmanager.com *.googleapis.com *.gstatic.com *.facebook.com *.twitter.com; font-src 'self' data: *.gstatic.com *.googleapis.com; connect-src 'self' *.google-analytics.com *.googleapis.com *.doubleclick.net *.facebook.com; frame-src 'self' *.doubleclick.net *.facebook.com *.twitter.com platform.twitter.com *.youtube.com; object-src 'none'; base-uri 'self';"
  },
  
  // Cabeçalhos para API
  api: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  
  // Otimizações de comprensão
  compression: {
    'Content-Encoding': 'br', // Brotli é geralmente mais eficiente que gzip
    'Vary': 'Accept-Encoding',
  },
  
  // Configurações de preload/prefetch
  preloadHints: [
    { path: '/src/theme-proplaynews/style.css', as: 'style' },
    { path: '/src/theme-proplaynews/assets/android-icon-96x96.png', as: 'image' },
    { path: '/src/theme-proplaynews/components/OptimizedImage.vue', as: 'script' },
    { path: '/src/theme-proplaynews/components/PerformanceManager.vue', as: 'script' },
  ],
  
  // Configurações para servidores específicos
  nginxConfig: `
    # Configuração Nginx para ProPlayNews
    location ~* \\.(jpg|jpeg|png|gif|ico|webp)$ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      add_header X-Content-Type-Options "nosniff";
    }
    
    location ~* \\.(css|js)$ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      add_header X-Content-Type-Options "nosniff";
    }
    
    location ~* \\.(woff|woff2|ttf|otf|eot)$ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
      add_header Access-Control-Allow-Origin "*";
    }
    
    # Ativar compressão
    gzip on;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
      application/javascript
      application/json
      application/x-javascript
      application/xml
      text/css
      text/javascript
      text/plain
      text/xml;
      
    # Se disponível, usar Brotli é ainda melhor que gzip
    brotli on;
    brotli_comp_level 6;
    brotli_types
      application/javascript
      application/json
      application/x-javascript
      application/xml
      text/css
      text/javascript
      text/plain
      text/xml;
  `,
  
  // Configuração para Vercel (vercel.json)
  vercelConfig: {
    headers: [
      {
        source: "/(.*)\\.(?:jpg|jpeg|gif|png|svg|ico|webp)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/(.*)\\.(?:css|js)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/(.*)\\.(?:woff|woff2|ttf|otf|eot)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ],
  },
}; 