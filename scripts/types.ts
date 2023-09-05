import { programs } from "@metaplex/js";

export declare type INFT = {
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