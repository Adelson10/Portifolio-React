import { rewrite, next } from '@vercel/edge';

export const config = {
  matcher: '/:path*',
};

// subdomain -> folder under /sites in the build output
const SITES = {
  loja: 'loja',
  colegio: 'colegio',
  gerador: 'gerador',
  mini: 'mini',
};

function hasFileExtension(pathname) {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const subdomain = host.split('.')[0];
  const site = SITES[subdomain];

  if (site) {
    url.pathname = hasFileExtension(url.pathname)
      ? `/sites/${site}${url.pathname}`
      : `/sites/${site}/index.html`;
    return rewrite(url);
  }

  // main portfolio: SPA fallback for react-router routes
  if (!hasFileExtension(url.pathname) && url.pathname !== '/') {
    url.pathname = '/index.html';
    return rewrite(url);
  }

  return next();
}
