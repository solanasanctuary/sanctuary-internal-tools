import { 
    CompiledInnerInstruction, 
    ConfirmedSignatureInfo, 
    Connection, 
    PublicKey, 
    TransactionResponse } from "@solana/web3.js"

export default async function handler(req:any, res:any) {
    
    const body = req.body;

    const CANDY_MACHINE_PROGRAM_ID: string = new PublicKey('CMZYPASGWeTz7RNGHaRJfCq2XQ5pYK6nDvVQxzkH51zb').toJSON()
    const CANDY_MACHINE_PROGRAM_ID_V1: string = new PublicKey('cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ').toJSON()
    const CANDY_MACHINE_PROGRAM_ID_V2: string = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ').toJSON()
    
    var endPoint: Connection; 
    var nftAddress: PublicKey; 
    var signaturesInfo: ConfirmedSignatureInfo[] | undefined; 
    var firstSignatureInfo: ConfirmedSignatureInfo | undefined; 
    var firstTxInfo: TransactionResponse | null = null;
    var firstTxAccounts: PublicKey[] | undefined; 
    var isValidAddress: boolean = false;
    var isNFT: boolean = false;
    var candyMachineVersion: number = -1;
    var candyMachineID: string = "";
    
    if(body.inputAddress.length == 44) {

      endPoint = new Connection("https://ssc-dao.genesysgo.net/");
      nftAddress = new PublicKey(body.inputAddress as string);
      signaturesInfo = await endPoint.getSignaturesForAddress(nftAddress);
      firstSignatureInfo = signaturesInfo[signaturesInfo.length - 1];
      
      if (firstSignatureInfo != undefined){
      isValidAddress = true
      firstTxInfo = await endPoint.getTransaction(firstSignatureInfo.signature);
      firstTxAccounts = firstTxInfo?.transaction?.message?.accountKeys;
      }else{firstTxInfo = null}}

    if (firstTxAccounts != undefined && isValidAddress){
      for (let acc of firstTxAccounts) {
        if ([CANDY_MACHINE_PROGRAM_ID, 
          CANDY_MACHINE_PROGRAM_ID_V1, 
          CANDY_MACHINE_PROGRAM_ID_V2].some((x) => x === acc.toJSON())) {isNFT = true}
          else {continue} 
      }
    }

    if (isValidAddress && isNFT && firstTxInfo != null) {
      var innerInstructions = firstTxInfo?.meta?.innerInstructions as unknown as CompiledInnerInstruction[];
      var instructions = firstTxInfo?.transaction?.message?.instructions;


      if (instructions != undefined && firstTxAccounts != undefined) {
        for (let ix of instructions) {
          let program_id = firstTxAccounts[ix.programIdIndex].toJSON();
 
          if (program_id === CANDY_MACHINE_PROGRAM_ID){
            candyMachineVersion = 0;
          } else if (program_id === CANDY_MACHINE_PROGRAM_ID_V1){
            candyMachineVersion = 1;
          } else if (program_id === CANDY_MACHINE_PROGRAM_ID_V2){
            candyMachineVersion = 2;
          } else {candyMachineVersion = -1}
        }

        for(let inner_ix of innerInstructions){
          if (candyMachineVersion == 2) {

          for (let i = 0; i < inner_ix.instructions.length; i++) {

            let accountsInvolved = inner_ix.instructions[i].accounts;
            for (let j = 0; j < accountsInvolved.length; j++) {
              let index = accountsInvolved[j];
              delete firstTxAccounts[index];
            }
          }
          var cleanFirstTxAccounts: PublicKey[] = JSON.parse(JSON.stringify(firstTxAccounts));
          if (cleanFirstTxAccounts != undefined) {
            for (let i = 0; i < cleanFirstTxAccounts.length; i++) {
              if (firstTxInfo?.transaction?.message?.isAccountWritable(i)) { continue }
              else { delete cleanFirstTxAccounts[i] }
            }
          }

          for (let acc of cleanFirstTxAccounts) {
            if (candyMachineID == "" && acc) {
              let candyMachineIDIndex = cleanFirstTxAccounts.indexOf(acc);
               candyMachineID = cleanFirstTxAccounts[candyMachineIDIndex].toString();
            }
          }
          return res.status(200).json({ data: candyMachineID });
        }
        else if (candyMachineVersion == 1) {
          var cleanFirstTxAccounts: PublicKey[] = JSON.parse(JSON.stringify(firstTxAccounts));
          
          if (cleanFirstTxAccounts != undefined) {
            for (let i = 0; i < cleanFirstTxAccounts.length; i++) {
              if (firstTxInfo?.transaction?.message?.isProgramId(i)) { delete cleanFirstTxAccounts[i] }
              else if (firstTxInfo?.transaction?.message?.isAccountSigner(i)){ delete cleanFirstTxAccounts[i] }
              else {continue}
            }
          }

          cleanFirstTxAccounts = cleanFirstTxAccounts.filter(function(x){
            return x !== undefined;
          });
          
          candyMachineID = cleanFirstTxAccounts[1].toString();
          return res.status(200).json({ data: candyMachineID });
        }
        else if (candyMachineVersion == 0) {
          var cleanFirstTxAccounts: PublicKey[] = JSON.parse(JSON.stringify(firstTxAccounts));
          
          if (cleanFirstTxAccounts != undefined) {
            for (let i = 0; i < cleanFirstTxAccounts.length; i++) {
              if (firstTxInfo?.transaction?.message?.isProgramId(i)) { delete cleanFirstTxAccounts[i] }
              else if (firstTxInfo?.transaction?.message?.isAccountSigner(i)){ delete cleanFirstTxAccounts[i] }
              else {continue}
            }
          }
          
          for (let acc of cleanFirstTxAccounts) {
            if (candyMachineID == "" && acc) {
              let candyMachineIDIndex = cleanFirstTxAccounts.indexOf(acc);
               candyMachineID = cleanFirstTxAccounts[candyMachineIDIndex].toString();
            }
          }
          return res.status(200).json({ data: candyMachineID });
        }
        else {
          return res.status(400).json({data: 'Your NFT is not minted through any CandyMachine program'});
        }}
      }
    } else {return res.status(400).json({data: 'Please introduce a valid NFT address'})};
    
    if (!body.inputAddress) {
      return res.status(400).json({ data: 'Please introduce a valid NFT address' });
    }
  }