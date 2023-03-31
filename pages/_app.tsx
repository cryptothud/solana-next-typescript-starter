import '../styles/globals.css'
import "../styles/fonts.css"
import '../components/wallet/wallet.css'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
require("@solana/wallet-adapter-react-ui/styles.css")
import MainLayout from '../components/layouts/mainLayout'
import { RecoilRoot } from 'recoil'
import { Head } from 'next/document'
import { projectName, projectDescription, previewBannerURL } from '../scripts/config'

const WalletProvider = dynamic(
  () => import("../components/wallet/Wallet"),
  {
    ssr: false,
  }
)

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="512x512" href="/favicon.ico" />

        {/* Misc. */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FAF7F2" />
        <meta name="fortmatic-site-verification" content="j93LgcVZk79qcgyo" />

        {/* Primary Meta Tags */}
        <title>{projectName}</title>
        <meta name="title" content={projectName} />
        <meta name="description" content={projectDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:title" content={projectName} />
        <meta property="og:description" content={projectDescription} />
        <meta property="og:image" content={previewBannerURL} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="/" />
        <meta property="twitter:title" content={projectName} />
        <meta property="twitter:description" content={projectDescription} />
        <meta property="twitter:image" content={previewBannerURL} />
      </Head>
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <WalletProvider>
            <MainLayout>
              <Component {...pageProps} />
            </MainLayout>
          </WalletProvider>
        </RecoilRoot>
      </QueryClientProvider>
    </>
  )
}
