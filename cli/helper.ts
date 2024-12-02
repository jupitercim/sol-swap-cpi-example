import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
const IDL = require('../target/idl/swap_to_sol.json');
import { SwapToSol } from "../target/types/swap_to_sol";
process.env.RPC_URL='https://api.mainnet-beta.solana.com'

import {
  PublicKey,
  Keypair,
  Connection,
  AddressLookupTableAccount,
  TransactionInstruction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const programId = new PublicKey(
  "ESzSND8xs8D6q7Q5wxMMViqsr8uVJ6mcHGRcLyXvxiE4"
);
export const jupiterProgramId = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);
export const wallet = new Wallet(
    Keypair.fromSecretKey(Uint8Array.from(JSON.parse("todo".trim())))
);
export const connection = new Connection(process.env.RPC_URL);
export const provider = new AnchorProvider(connection, wallet, {
  commitment: "processed",
});
anchor.setProvider(provider);
// export const program = new Program(IDL as anchor.Idl, programId, provider);
export const program = new anchor.Program<SwapToSol>(IDL, provider);

const findProgramAuthority = (): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    programId
  )[0];
};
export const programAuthorityAccount = findProgramAuthority();

console.log(programAuthorityAccount)

const findProgramWSOLAccount = (): PublicKey => {
  return PublicKey.findProgramAddressSync([Buffer.from("wsol")], programId)[0];
};
export const programWSOLAccount = findProgramWSOLAccount();

export const findAssociatedTokenAddress = ({
  walletAddress,
  tokenMintAddress,
}: {
  walletAddress: PublicKey;
  tokenMintAddress: PublicKey;
}): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
};

export const getAdressLookupTableAccounts = async (
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
    await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
};

export const instructionDataToTransactionInstruction = (
  instructionPayload: any
) => {
  if (instructionPayload === null) {
    return null;
  }

  // console.log("instructionPayload.accounts:"+JSON.stringify(instructionPayload.accounts))
  // console.log("instructionPayload.data:"+JSON.stringify(instructionPayload.data))


  return new TransactionInstruction({
    programId: new PublicKey(instructionPayload.programId),
    keys: instructionPayload.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: false,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instructionPayload.data, "base64"),
  });
};
