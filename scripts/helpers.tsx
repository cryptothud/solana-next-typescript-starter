import { BlockheightBasedTransactionConfirmationStrategy, Connection, PublicKey, SendOptions, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "../node_modules/@solana/spl-token";
import axios from "axios";
import { programs } from "@metaplex/js";
import hashlist from "./hashlist.json"

export declare type NFT = {
  mint: string;
  onchainMetadata: programs.metadata.MetadataData;
  externalMetadata: {
    attributes: Array<any>;
    collection: any;
    description: string;
    edition: number;
    external_url: string;
    image: string;
    name: string;
    properties: {
      files: Array<string>;
      category: string;
      creators: Array<{
        pubKey: string;
        address: string;
      }>;
    };
    seller_fee_basis_points: number;
  };
};

const {
  metadata: { Metadata },
} = programs;

export async function getNFTMetadata(
  mint: string,
  conn: Connection
): Promise<NFT> {
  try {
    const metadataPDA = await Metadata.getPDA(mint);
    const onchainMetadata = (await Metadata.load(conn, metadataPDA)).data;
    const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
    return {
      mint: mint,
      onchainMetadata,
      externalMetadata
    };
  } catch (e) {
    console.log(`failed to pull metadata for token ${mint}`);
  }
}

export async function getNFTMetadataForMany(
  tokens: string[],
  conn: Connection
): Promise<any> {
  const promises: Promise<NFT | undefined>[] = [];
  tokens.forEach((token) =>
    promises.push(getNFTMetadata(token, conn))
  );
  const nfts = (await Promise.all(promises)).filter((n) => !!n);
  return nfts;
}

export async function getNFTsByOwner(
  owner: PublicKey,
  conn: Connection
): Promise<any> {
  const tokenAccounts = await conn.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const tokens = tokenAccounts.value
    .filter((tokenAccount: any) => tokenAccount.account.data.parsed.info.tokenAmount.amount === "1")
    .map((o: any) => o.account.data.parsed.info.mint)
    //include line below to only include nfts from your project!
    //.filter((tokenAccount) => hashlist.includes(tokenAccount));

  return await getNFTMetadataForMany(tokens, conn);
}

export function shortenAddress(string: string | undefined) {
  if (string === undefined) {
    return ""
  } else {
    return string.substring(0, 4) + "..." + string.substring(string.length - 4, string.length)
  }
}

export declare type RunTxnResult = {
  txnSignature: string;
  confirmationMessage: string;
  success: boolean;
};

export async function waitForTransactionToBeConfirmed(
  signature: string,
  connection: Connection
): Promise<boolean> {
  try {
    console.log("Confirming tx: ", signature)
    const newConnection = new Connection(connection.rpcEndpoint);
    const blockdetails = await newConnection.getLatestBlockhash();

    const confirmStrategy: BlockheightBasedTransactionConfirmationStrategy = {
      signature: signature,
      blockhash: blockdetails.blockhash,
      lastValidBlockHeight: blockdetails.lastValidBlockHeight,
    };

    const conf = await newConnection.confirmTransaction(
      confirmStrategy,
      "confirmed"
    );
    return conf.value.err === null;
  } catch (e) {
    console.error(`confirmTransaction error: ${e.message}`);
    return false;
  }
}

export const wait = (ms: any) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const paginate = (array: any, pageSize: any, pageNumber: any) => {
  return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

export const requestData = (body: any) => {
  return {
    method: 'POST',
    header: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}