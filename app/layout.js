import localFont from 'next/font/local';
import "./globals.css";

const twkIssey = localFont({
  src: './fonts/TWKIssey/Web/TWKIssey-Regular.woff2',
  variable: '--font-twk-issey',
  display: 'swap',
});

export const metadata = {
  title: "Hover Villas Master Plan",
  description: "Interactive master plan for the villa community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={twkIssey.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
      </head>
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
