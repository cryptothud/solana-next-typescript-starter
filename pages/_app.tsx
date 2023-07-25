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
import { projectName, projectDescription, previewBannerURL, proxy } from '../scripts/config'
import { IKContext } from "imagekitio-react"

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
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <WalletProvider>
            <IKContext urlEndpoint={proxy}>
              <MainLayout>
                <Component {...pageProps} />
              </MainLayout>
            </IKContext>
          </WalletProvider>
        </RecoilRoot>
      </QueryClientProvider>
    </>
  )
}
