import { useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { getNFTsByOwner } from "../scripts/helpers";

const useNFTs = (wallet: WalletContextState) => {
    const { connection } = useConnection();
    return useQuery(["wallet", wallet?.publicKey], async () => {
        const nfts = await getNFTsByOwner(wallet?.publicKey, connection);
        return nfts || [];
    }, {
        enabled: !!wallet?.publicKey
    })
}
export default useNFTs