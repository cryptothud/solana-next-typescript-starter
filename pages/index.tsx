import Head from 'next/head'
import { DisplayNFTs } from '../components/examples/displayNFTs'
import { DisplaySOL } from '../components/examples/displaySOL'
import { previewBannerURL, projectDescription, projectName } from '../scripts/config'

export default function Home() {

  return (
    <>
      <Head>
        <meta name="twitter:title" content={projectName} />
        <meta
          name="twitter:description"
          content={projectDescription}
        />
        <meta name="twitter:image" content={previewBannerURL} />
        <meta name="twitter:card" content="summary_large_image" />
        <title>{projectName}</title>
        <link rel="shortcut icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="512x512" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#393E48" />
        <meta name="fortmatic-site-verification" content="j93LgcVZk79qcgyo" />
        <meta property="og:url" content="/" />
        <meta property="og:title" content={projectName} />
        <meta
          property="og:description"
          content={projectDescription}
        />
        <meta property="og:image" content={previewBannerURL} />
      </Head>
      <div className="flex flex-col justify-center items-center">
        <DisplaySOL />
        <DisplayNFTs />
      </div>
    </>
  )
}
