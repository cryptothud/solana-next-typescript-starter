import { useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQueries, useQuery } from "@tanstack/react-query";

const useSolBalance = (wallet: WalletContextState) => {
    const { connection } = useConnection()
    return useQuery(["user", wallet?.publicKey], async () => {
        const balance = await connection.getBalance(wallet?.publicKey);
        return {
            rawBalance: balance || 0,
            balance: (balance / LAMPORTS_PER_SOL) || 0
        }
    }, {
        enabled: !!wallet?.publicKey
    })
}

export default useSolBalance;