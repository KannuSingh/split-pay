import {  Contract, ethers } from "ethers"
import ERC6551REGISTRY_ABI from "./abis/ERC6551Registry.json"
import ENTRY_POINT_ABI from "./abis/EntryPoint.json"
import SIMPLE_6551_X_4337_ACCOUNT_ABI from "./abis/Simple_6551_X_4337_Account.json"
import { ERC6551Registry } from "./abis/types/ERC6551Registry";
import { EntryPoint, Simple6551ZkAccount } from "./abis/types";

const ERC6551_REGISTRY_ADDRESS = "0x02101dfB77FDE026414827Fdc604ddAF224F0921"
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

export class ERC6551RegistryUtil {
    
    readonly _entryPoint: EntryPoint;
    readonly _erc6551Registry:ERC6551Registry;
    readonly _accountImplementation:string;
    readonly _signer
    /**
     * @notice Create ERC_6551_Registry instance to interact with
     * @param signerOrProvider signer or provider to use
     */
    constructor(signer: ethers.providers.JsonRpcSigner, accountImplementation:string ) {
        this._erc6551Registry = new Contract(ERC6551_REGISTRY_ADDRESS,ERC6551REGISTRY_ABI,signer) as ERC6551Registry
        this._entryPoint = new Contract(ENTRY_POINT_ADDRESS,ENTRY_POINT_ABI,signer) as EntryPoint
        this._accountImplementation = accountImplementation
        this._signer = signer
    }

    async getUserSimple4337ZkAccountAddress(chainId:number,tokenAddress:string,tokenId:number,salt:number): Promise<[simpleAccountAddress:string,initCode:string]>  {
        try{
            const initCode = ethers.utils.hexConcat([
                ERC6551_REGISTRY_ADDRESS,
                this._erc6551Registry.interface.encodeFunctionData("createAccount",
                     [this._accountImplementation,        // account implementation address
                      chainId,                            // chainId
                      tokenAddress,                       // nft contract address
                      tokenId,                            // nft token id
                      salt,                               // salt
                      "0x"                                // initcode
                      ]),
            ])
            console.log([this._accountImplementation,        // account implementation address
            chainId,                            // chainId
            tokenAddress,                       // nft contract address
            tokenId,                            // nft token id
            salt,                               // salt
            "0x"                                // initcode
            ])
            console.log("Generated initCode for deploying TBA:", initCode)
            
            // CALCULATE THE SENDER ADDRESS
            const senderAddress = await this._erc6551Registry.account(
                      this._accountImplementation,        // account implementation address
                      chainId,                            // chainId
                      tokenAddress,                       // nft contract address
                      tokenId,                            // nft token id
                      salt
                    );
            
            console.log("Calculated TBA account address:", senderAddress)
            return [senderAddress,initCode]
        }catch(err){
            console.log(err)
        }
        return ['','']
    }

    getSimple6551ZkAccountContract(address:string):Simple6551ZkAccount  {
       return  new Contract(address,SIMPLE_6551_X_4337_ACCOUNT_ABI,this._signer) as Simple6551ZkAccount 
    }
}
 
