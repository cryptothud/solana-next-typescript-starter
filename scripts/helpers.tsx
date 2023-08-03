import { BlockheightBasedTransactionConfirmationStrategy, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SendOptions, Signer, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "../node_modules/@solana/spl-token";
import axios from "axios";
import { programs } from "@metaplex/js";
import hashlist from "./hashlist.json"
import { WalletContextState } from "@solana/wallet-adapter-react";
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import { keypairIdentity, Metaplex, sol, token } from '@metaplex-foundation/js';
import bs58 from "bs58";
import { MouseEventHandler, useState } from "react";
import Image from "next/image";
import crypto from 'crypto';
import { toast } from "react-toastify";
import { IKImage } from "imagekitio-react";

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

export const requestDataNode = (body: any) => {
  return {
    method: 'POST',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body)
  }
}

export const isServerRunning = async () => {
  try {
    const status = await (await fetch(`${process.env.NEXT_PUBLIC_SERVER_NAME}/check`)).json()

    if (status.info === "success") {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

const getIP = request =>
  request.ip ||
  request.headers['x-forwarded-for'] ||
  request.headers['x-real-ip'] ||
  request.connection.remoteAddress

const getRateLimitMiddlewares = ({
  limit = 200,
  windowMs = 60 * 1000,
  delayAfter = Math.round(10 / 2),
  delayMs = 500,
} = {}) => [
    slowDown({ keyGenerator: getIP, windowMs, delayAfter, delayMs }),
    rateLimit({ keyGenerator: getIP, windowMs, max: limit }),
  ]


const applyMiddleware = middleware => (request, response) =>
  new Promise((resolve, reject) => {
    middleware(request, response, result =>
      result instanceof Error ? reject(result) : resolve(result)
    )
  })


export const middlewares = getRateLimitMiddlewares().map(applyMiddleware)


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


/* 
* most standard way to send a solana transaction

* example:
* const wallet = useWallet()
* const connection = useConnection()
* await sendSolanaTransaction(
*   wallet,
*   connection,
*   [...solInstructions(...), await splInstructions(...)]
* )
*/
export const sendSolanaTransaction = async (wallet: WalletContextState, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
  // starts at 0 to keep track and make sure it doesn't keep trying forever
  let attempt = (lastAttempt ?? 0) + 1
  const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
  const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

  // creates transaction, requests wallet to sign, and sends transaction
  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = wallet.publicKey!
  transaction.recentBlockhash = blockhashResponse.value.blockhash
  const signedTx = await wallet.signTransaction?.(transaction)
  const signature = await connection.sendRawTransaction(signedTx?.serialize()!);

  // waits for transaction to confirm
  let confirmed = false
  confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

  // handles dropped transactions, and will try up to 5 times
  if (attempt <= 5) {
    if (confirmed === false) {
      console.log("Transaction failed, please try again!")
      return await sendSolanaTransaction(wallet, connection, instructions, attempt)
    } else {
      return true
    }
  } else {
    console.log("Transaction failed after 5 tries.")
    return false
  }
}


/* 
* used to send a v0 solana transaction

* example:
* const wallet = useWallet()
* const connection = useConnection()
* await sendV0SolanaTransaction(
*   wallet,
*   connection,
*   [...solInstructions(...), await splInstructions(...)]
* )
*/
export const sendV0SolanaTransaction = async (wallet: WalletContextState, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
  // starts at 0 to keep track and make sure it doesn't keep trying forever
  let attempt = (lastAttempt ?? 0) + 1
  const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
  const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

  // creates transaction, requests wallet to sign, and sends transaction
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey!,
    recentBlockhash: blockhashResponse.value.blockhash,
    instructions: instructions
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  const signedTx = await wallet.signTransaction?.(transaction)
  const signature = await connection.sendRawTransaction(signedTx?.serialize()!);

  // waits for transaction to confirm
  let confirmed = false
  confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

  // handles dropped transactions, and will try up to 5 times
  if (attempt <= 5) {
    if (confirmed === false) {
      console.log("Transaction failed, please try again!")
      return await sendV0SolanaTransaction(wallet, connection, instructions, attempt)
    } else {
      return true
    }
  } else {
    console.log("Transaction failed after 5 tries.")
    return false
  }
}


/* 
* !! ONLY TO BE USED IN THE BACKEND !! this will typically expose the private key and is not meant for client side transactions
* most standard way to send a solana transaction, but it is autosigned by a Keypair

* example:
* const wallet = createKeypair(...)
* const connection = useConnection()
* await sendSolanaTransactionWithSigner(
*   wallet,
*   connection,
*   [...solInstructions(...), await splInstructions(...)]
* )
*/
export const sendSolanaTransactionWithSigner = async (wallet: Signer, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
  // starts at 0 to keep track and make sure it doesn't keep trying forever
  let attempt = (lastAttempt ?? 0) + 1
  const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
  const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

  // creates transaction, requests wallet to sign, and sends transaction
  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = wallet.publicKey
  transaction.recentBlockhash = blockhashResponse.value.blockhash
  transaction.sign(wallet)
  const signature = await connection.sendRawTransaction(transaction.serialize());

  // waits for transaction to confirm
  let confirmed = false
  confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

  // handles dropped transactions, and will try up to 5 times
  if (attempt <= 5) {
    if (confirmed === false) {
      console.log("Transaction failed, trying again!")
      return await sendSolanaTransactionWithSigner(wallet, connection, instructions, attempt)
    } else {
      return true
    }
  } else {
    console.log("Transaction failed after 5 tries.")
    return false
  }
}


export const createKeypair = (privateKey: string) => {
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}


export const createMetaplex = (connection: Connection, keypair: Keypair) => {
  const metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(keypair));
  return metaplex
}


export const solInstructionsUsingMetaplex = (metaplex: Metaplex, toOwner: PublicKey, amount: number) => {
  return metaplex.system().builders().transferSol({
    to: toOwner,
    amount: sol(amount),
  }).getInstructions()
}


export const splInstructionsUsingMetaplex = async (metaplex: Metaplex, toOwner: PublicKey, amount: number, splToken: PublicKey) => {
  return (await metaplex.tokens().builders().send({
    mintAddress: splToken,
    toOwner,
    amount: token(amount),
  })).getInstructions()
}


/* 
* use this function to support transfer of pNFTs
*/
export const nftInstructionsUsingMetaplex = async (metaplex: Metaplex, fromOwner: PublicKey, toOwner: PublicKey, splToken: PublicKey, authority: any) => {
  const nftOrSft = await metaplex.nfts().findByMint({ mintAddress: splToken });

  let instructions = []

  if (nftOrSft.tokenStandard === 4) {
    instructions.push(...metaplex.nfts().builders().transfer({
      nftOrSft,
      fromOwner,
      toOwner,
      authorizationDetails: {
        rules: nftOrSft.programmableConfig.ruleSet
      },
      authority: authority
    }).getInstructions())
  } else {
    instructions.push(...metaplex.nfts().builders().transfer({
      nftOrSft,
      fromOwner,
      toOwner,
      authority: authority
    }).getInstructions())
  }

  return instructions
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

export const ImageWithFallback = ({ alt, src, fallbackSrc, className, width, height }: { alt: string, src: string, fallbackSrc: string, className: string, width: number | `${number}`, height: number | `${number}` }) => {
  const [imgSrc, setImgSrc] = useState(src ?? fallbackSrc);

  return (
    <Image
      alt={alt}
      src={imgSrc}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
      className={className}
      width={width}
      height={height}
      priority
    />
  );
};

export const importKey = async (keyData: string, keyUsage: KeyUsage[]): Promise<CryptoKey> => {
  const parsedKey = JSON.parse(keyData);
  const key = await window.crypto.subtle.importKey(
    'jwk',
    parsedKey,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    },
    true,
    keyUsage
  );
  return key;
};

export const encryptData = async (data: string, publicKey: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    dataBuffer
  );

  const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
  const encryptedData = btoa(String.fromCharCode(...encryptedArray));

  return encryptedData;
};


export const importKeyBackend = async (keyData: string, keyUsage: KeyUsage[]): Promise<crypto.KeyObject> => {
  const parsedKey = JSON.parse(JSON.parse(keyData));

  const key = crypto.createPrivateKey({
    key: parsedKey,
    format: 'jwk',
    type: 'pkcs8',
  });

  return key;
};

export const decryptData = async (encryptedData: string, privateKey: crypto.KeyObject): Promise<string> => {
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');

  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedBuffer
  );

  return decryptedBuffer.toString('utf8');
};

export const walletNotConnectedPopup = () => {
  toast.dismiss()
  toast.info("Wallet not connected.")
}

export const errorPopup = (error?: string) => {
  toast.dismiss()
  toast.error(`Error!${error ? ` ${error}` : ''}`)
}

export const connections = [
  "https://wandering-multi-hexagon.solana-mainnet.quiknode.pro/1ed143c42870d43b9b3c14edef33b5da431ea14e/",
  "https://sly-ancient-water.solana-mainnet.quiknode.pro/1f85f307b91244eabbf3e8edc31913a1e9f0ee65/",
  "https://green-polished-fire.solana-mainnet.quiknode.pro/0b8461a7cacccb991a0872d883157a01b7698b93/",
  "https://methodical-alien-diamond.solana-mainnet.quiknode.pro/915c906e06afd5bad621a099696d66253b38028a/",
  "https://hidden-purple-sponge.solana-mainnet.quiknode.pro/b2c98d2a6bcce7004f7c48e047b42f97c8e61a69/",
  "https://little-nameless-market.solana-mainnet.quiknode.pro/f32b801f07671c87541eb4867a0c4a3d2ed26bb8/",
  "https://bitter-evocative-glitter.solana-mainnet.quiknode.pro/aadeca4760637868fbcdf730332c5d848fd99b05/",
  "https://lingering-winter-vineyard.solana-mainnet.quiknode.pro/cac2c64de80fb7bd7895357dbd96a436320d0441/",
  "https://sparkling-wispy-dust.solana-mainnet.quiknode.pro/555ff48e42a059a53cc40fe214985817aa037436/",
  "https://small-delicate-ensemble.solana-mainnet.quiknode.pro/4470569f19498f848dca510b6757b179ba1cdb16/"
]

export const randomConnection = () => {
  return new Connection(connections[Math.floor(Math.random() * connections.length)], { commitment: "confirmed", confirmTransactionInitialTimeout: 60000 });
}

export const generateNewKeypair = async () => {
  const exportKey = async (key: CryptoKey): Promise<string> => {
    const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exportedKey);
  };
  const generate = async (): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: 'SHA-256' },
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  };
  // Generate the key pair
  const keyPair = await generate();

  // Export the keys as text
  const publicKeyText = await exportKey(keyPair.publicKey);
  const privateKeyText = await exportKey(keyPair.privateKey);

  console.log('Public Key:', publicKeyText);
  console.log('Private Key:', privateKeyText);
}

const fixUrl = (url: string) => {
  if (url.includes("arweave.net/")) {
    return `${url.split("arweave.net/")[1]}`
  } else if (url.includes("shdw-drive.genesysgo.net/")) {
    return `${url.split("shdw-drive.genesysgo.net/")[1]}`
  } else if (url.includes("nftstorage.link/")) {
    return `${url.split("nftstorage.link/")[1]}`
  } else {
    return url
  }
}

export const ImageWithProxyFallback = ({ src, width, height, className, style, onClick, alt }: { src: string, width: string, height: string, className?: string, style?: any, onClick?: MouseEventHandler<HTMLImageElement>, alt?: string }) => {
  // // If the proxy image fails to load, switch to the original image
  const handleError = (event) => {
    event.target.src = src;
  };

  return (
    <IKImage
      path={fixUrl(src)}
      transformation={[{
        "height": height,
        "width": width
      }]}
      loading="lazy"
      lqip={{ active: true }}
      onError={handleError}
      className={className}
      style={style}
      onClick={onClick}
      alt={alt ?? ""}
    />
  )
};