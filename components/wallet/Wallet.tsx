import React, { FC, useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

const Wallet = ({ children }: { children: any }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = process.env
    .NEXT_PUBLIC_CONNECTION_NETWORK as WalletAdapterNetwork

  const endpoint =
    process.env.NEXT_PUBLIC_CONNECTION_NETWORK == "devnet"
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_HOST_DEVNET
      : process.env.NEXT_PUBLIC_SOLANA_RPC_HOST_MAINNET_BETA

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  )

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: "processed",
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default Wallet
