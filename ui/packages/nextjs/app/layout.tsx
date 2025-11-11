import "@rainbow-me/rainbowkit/styles.css";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";
// Import polyfill for indexedDB in SSR
import "~~/utils/polyfill-indexeddb";

export const metadata = getMetadata({
  title: "Anonymous Voting System",
  description: "Privacy-preserving anonymous voting using FHEVM",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning data-theme="corporate">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider enableSystem>
          <DappWrapperWithProviders>{children}</DappWrapperWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default DappWrapper;
