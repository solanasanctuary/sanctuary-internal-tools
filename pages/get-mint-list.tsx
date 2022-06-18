import styles from "../styles/Home.module.css";
import { sliceIntoChunks } from "./slice-into-chunks"
import { Connection, ParsedInstruction, PublicKey } from "@solana/web3.js";
import { from } from "rxjs";
import { mergeMap, toArray, map } from "rxjs/operators";

let count = 0;
export async function getMints(
  candy_id: string,
  connection: Connection
) {
  return new Promise(async (resolve) => {
    console.log("hello world");
    let all_signatures = [];
    let options = { before: undefined, limit: 1000 };
    let retries = 0;
    while (true) {
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(candy_id),
        options
      );
      if (signatures.length == 0) {
        // GBT errors can cause empty returns, we try a few times
        if (retries < 10) {
          retries++;
        } else {
          break;
        }
      } else {
        //options.before = signatures[signatures.length - 1].signature;
        all_signatures.push(...signatures);
        retries = 0;
      }
    }

    console.log(all_signatures);

    // Slice into chunks to avoid hitting size limit;
    const chunks = sliceIntoChunks(all_signatures, 150);

    from(chunks)
      .pipe(
        mergeMap(async (chunk) => {
          let parsedTxs = await connection.getParsedTransactions(
            chunk.map((tx) => tx.signature)
          );
          // GBT errors can cause empty returns, we try a 'few' times
          while (parsedTxs?.every((tx) => !tx)) {
            parsedTxs = await connection.getParsedTransactions(
              chunk.map((tx) => tx.signature)
            );
          }
          return parsedTxs;
        }, 8),
        map((chunk) => {
          return chunk
            .map((h) => {
              const mint = (
                h?.transaction?.message?.instructions as ParsedInstruction[]
              )?.find((ix) => ix?.parsed?.type === "mintTo")?.parsed?.info
                ?.mint;
              if (!h?.meta?.err && mint) {
                count++;
                return mint;
              }
            })
            .filter((r) => !!r);
        }),
        toArray()
      )
      .subscribe((res) => {
        resolve(res.flat());
        count = 0;
      });
  });
}

export default function GetMintList() {

  const handleSubmit = async (event: any) => {

    event.preventDefault()
    let publicKey = event.target.inputAddress.value;
    let solanaConnection = new Connection('https://api.devnet.solana.com');
    console.log(publicKey);
    console.log(solanaConnection);
    getMints(publicKey, solanaConnection);
    
    //TODO test getMints or add new endpoing similar to JL's work
    //existing key MBMbdocXHzZ8Lj6Wi9dSA5Kz88hzw8XF4Fi66UkN9fP

  }

  return (
  <div className={styles.container}>
    <div className={styles.card}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Get Mint List
        </h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="inputAddress" ></label>
          <input type="text" id="inputAddress" name="inputAddress"
          placeholder="Input the NFT token address" required />
          <button type="submit">Submit</button>
      </form>
      </main>
    </div>
  </div>
);
};