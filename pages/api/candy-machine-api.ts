import { 
  ConfirmedSignatureInfo, 
  Connection, 
  PublicKey, 
  TransactionResponse } from "@solana/web3.js"

import { 
  CANDY_MACHINE_PROGRAM_ID_V0,
  CANDY_MACHINE_PROGRAM_ID_V1,
  CANDY_MACHINE_PROGRAM_ID_V2,
  RPC_PROVIDER } from "../../utils/accounts";

export default async function handler(req:any, res:any) {
    
    const body = req.body;
    var endPoint: Connection; 
    var nftAddress: PublicKey; 
    var signaturesInfo: ConfirmedSignatureInfo[] | undefined; 
    var firstSignatureInfo: ConfirmedSignatureInfo | undefined; 
    var firstTxInfo: TransactionResponse | null = null;
    var firstTxAccounts: PublicKey[] | undefined; 
    var isValidAddress: boolean = false;
    var candyMachineVersion: number;
    var candyMachineID: string;
    var candyMachineAccountIndex: number;
    
    if(body.inputAddress.length == 44) {

      endPoint = new Connection(RPC_PROVIDER);
      nftAddress = new PublicKey(body.inputAddress as string);
      signaturesInfo = await endPoint.getSignaturesForAddress(nftAddress);
      firstSignatureInfo = signaturesInfo[signaturesInfo.length - 1];
      
      if (firstSignatureInfo != undefined){
        
      isValidAddress = true
      firstTxInfo = await endPoint.getTransaction(firstSignatureInfo.signature);
      firstTxAccounts = firstTxInfo?.transaction?.message?.accountKeys;
      
      } else {

        firstTxInfo = null;

      }
    }

    if (isValidAddress && firstTxInfo != null) {

      var instructions = firstTxInfo?.transaction?.message?.instructions;

      if (instructions != undefined && firstTxAccounts != undefined) {
        
        for (let instruction of instructions) {
          
          let program_id = firstTxAccounts[instruction.programIdIndex].toJSON();
 
          if (program_id === CANDY_MACHINE_PROGRAM_ID_V0){
            
            candyMachineVersion = 0;
            candyMachineAccountIndex = instruction.accounts[1];
            candyMachineID = firstTxAccounts[candyMachineAccountIndex].toString();
            return res.status(200).json({ 
              candyMachineID: candyMachineID,
              candyMachineVersion: candyMachineVersion 
            });
          
          } else if (program_id === CANDY_MACHINE_PROGRAM_ID_V1){
            
            candyMachineVersion = 1;
            candyMachineAccountIndex = instruction.accounts[1];
            candyMachineID = firstTxAccounts[candyMachineAccountIndex].toString();
            return res.status(200).json({ 
              candyMachineID: candyMachineID,
              candyMachineVersion: candyMachineVersion 
            });

          } else if (program_id === CANDY_MACHINE_PROGRAM_ID_V2){
            
            candyMachineVersion = 2;
            candyMachineAccountIndex = instruction.accounts[0];
            candyMachineID = firstTxAccounts[candyMachineAccountIndex].toString();
            return res.status(200).json({ 
              candyMachineID: candyMachineID,
              candyMachineVersion: candyMachineVersion 
            });

          } else {
            
            candyMachineVersion = -1;
          
          }
        }
        
        if (candyMachineVersion = -1){

          return res.status(400).json({ candyMachineID: "Your NFT is not minted through any CandyMachine program" });
        
        }
      }
    } else {return res.status(400).json({candyMachineID: 'Please introduce a valid NFT address'})};
  }
