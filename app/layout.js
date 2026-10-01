export const metadata = {
  title: 'Veel Admin — products & orders',
  description: 'Veel Thrifts admin: add clothes, photos, descriptions and receive customer orders.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#171c3a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
