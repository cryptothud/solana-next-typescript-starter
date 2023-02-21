import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import useNFTs from "../../hooks/useNFTs";
import { paginate } from "../../scripts/helpers";
import { Loading } from "../Loading";
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'
import useSolBalance from "../../hooks/useSolBalance";

export const DisplaySOL = () => {

    const wallet = useWallet()
    const { data: userBalance, isLoading: isLoadingBalance } = useSolBalance(wallet)

    if (wallet?.publicKey) {
        return (
            <div className="w-[600px] max-w-[calc(100vw-30px)] bg-[#ffffff10] rounded-[10px] m-10 border border-[#ffffff30] flex flex-col gap-10 p-10 items-center justify-center">
                <div className="flex flex-wrap gap-3 items-center justify-center">
                    {isLoadingBalance ?
                        <Loading size={20} color={"#fff"} />
                        : <h1 className="text-white">{`SOL Balance: ${userBalance?.balance?.toFixed(2)}`}</h1>}
                </div>
            </div>
        )
    } else {
        return <></>
    }
}