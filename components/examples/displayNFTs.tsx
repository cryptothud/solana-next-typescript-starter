import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import useNFTs from "../../hooks/useNFTs";
import { paginate } from "../../scripts/helpers";
import { Loading } from "../Loading";
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io'

export const DisplayNFTs = () => {

    const wallet = useWallet()
    const { data: userNFTs, isLoading: isLoadingNFTs } = useNFTs(wallet);
    const [page, setPage] = useState(1)
    const nftsPerPage = 10

    return (
        <div className="w-[600px] max-w-[calc(100vw-30px)] bg-[#ffffff10] rounded-[10px] m-10 border border-[#ffffff30] flex flex-col gap-10 p-10 items-center justify-center">
            <div className="flex flex-wrap gap-3 items-center justify-center">
                {!wallet.publicKey ?
                    <h1 className="text-white">{`Wallet not connected!`}</h1>
                    : isLoadingNFTs ?
                        <Loading size={20} color={"#fff"} />
                        : userNFTs?.length > 0 ?
                            paginate(userNFTs, nftsPerPage, page).map((o) => {
                                return <img key={JSON.stringify(o)} src={o.externalMetadata.image} className="w-32 h-32 rounded-[10px]" />
                            })
                            : <h1 className="text-white">{`No NFT's found in your wallet!`}</h1>}
            </div>
            {nftsPerPage < userNFTs?.length && (
                <div className="flex gap-3">
                    <button disabled={page === 1} className="bg-white text-black font-medium text-xl w-[40px] h-[40px] m-auto flex items-center justify-center rounded-[10px]" onClick={() => setPage((prev: number) => prev - 1)}>
                        <IoIosArrowBack />
                    </button>
                    <button disabled={page * nftsPerPage >= userNFTs?.length} className="bg-white text-black font-medium text-xl w-[40px] h-[40px] m-auto flex items-center justify-center rounded-[10px]" onClick={() => setPage((prev: number) => prev + 1)}>
                        <IoIosArrowForward />
                    </button>
                </div>
            )}
        </div>
    )
}