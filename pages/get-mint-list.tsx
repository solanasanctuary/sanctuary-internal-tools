import type { NextPage } from "next";
import Head from "next/head";
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
    let all_signatures = [];
    let options = { before: undefined, limit: 1000 };
    let retries = 0;
    while (true) {
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey("MBMbdocXHzZ8Lj6Wi9dSA5Kz88hzw8XF4Fi66UkN9fP"),
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

const Template: NextPage = () => {
  console.log("what up!!!");
  let my_connection = new Connection('https://api.devnet.solana.com');

  getMints("Syx", my_connection);

  return (
    <div className={styles.container}>
      <Head>
        <title>Get mint list</title>
        <meta name="description" content="This page will generate the mint list based on candy machine ID" />
      </Head>

      <h1>Get Mint List!</h1>

      <div>

      </div>

    </div>
  );
};

export default Template;
