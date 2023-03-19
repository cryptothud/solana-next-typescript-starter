import { BlockheightBasedTransactionConfirmationStrategy, Connection, LAMPORTS_PER_SOL, PublicKey, SendOptions, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "../node_modules/@solana/spl-token";
import axios from "axios";
import { programs } from "@metaplex/js";
import hashlist from "./hashlist.json"
import { WalletContextState } from "@solana/wallet-adapter-react";

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

export const isBlockhashExpired = async (connection: Connection, lastValidBlockHeight: number) => {
  let currentBlockHeight = (await connection.getBlockHeight('finalized'));
  return (currentBlockHeight > lastValidBlockHeight - 150); // If currentBlockHeight is greater than, blockhash has expired.
}

export const confirmSignatureStatus = async (signature: string, connection: Connection, lastValidHeight: number) => {
  let hashExpired = false;
  let txSuccess = false;
  while (!hashExpired && !txSuccess) {
    const { value: status } = await connection.getSignatureStatus(signature);

    // Break loop if transaction has succeeded
    if (status && ((status.confirmationStatus === 'confirmed' || 'finalized'))) {
      txSuccess = true;
      console.log(`Transaction Success. View on explorer: https://solscan.io/tx/${signature}`);
      break;
    }
    hashExpired = await isBlockhashExpired(connection, lastValidHeight);

    // Break loop if blockhash has expired
    if (hashExpired) {
      console.log(`Blockhash has expired.`);
      // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
      return false
    }

    // Check again after 2.5 sec
    await wait(2500);
  }
  return txSuccess
}

export const solInstruction = (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number) => {
  return SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: toPubkey,
    lamports: Math.round(amount * LAMPORTS_PER_SOL)
  })
}

export const splInstructions = async (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number, token: PublicKey, connection: Connection) => {
  let instructions: TransactionInstruction[] = []
  const source = await getAssociatedTokenAddress(token, fromPubkey)
  const dest = await getAssociatedTokenAddress(token, toPubkey)
  const supply = await connection.getTokenSupply(token)
  const accountInfo = await connection.getAccountInfo(dest)
  if (accountInfo === null) {
    instructions.push(createAssociatedTokenAccountInstruction(fromPubkey, dest, toPubkey, token))
  }
  instructions.push(createTransferInstruction(source, dest, fromPubkey, Math.round((amount) * (10 ** +supply.value.decimals))))
  return instructions
}

export const sendSolanaTransaction = async (wallet: WalletContextState, connection: Connection, instructions: TransactionInstruction[]) => {

  const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
  const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhashResponse.value.blockhash,
    instructions: instructions
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);
  const signedTx = await wallet.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  let confirmed = false
  confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

  if (confirmed === false) {
    console.log("Transaction failed, please try again!")
    confirmed = await sendSolanaTransaction(wallet, connection, instructions)
  }

  return confirmed

}