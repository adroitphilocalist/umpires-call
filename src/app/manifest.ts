import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Umpire's Call",
    short_name: 'UmpiresCall',
    description: 'Play fantasy cricket and compete with others',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1020',
    theme_color: '#F59E0B',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
