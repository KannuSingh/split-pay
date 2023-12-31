import { BytesLike, Hexable, hexValue } from "ethers/lib/utils"
const groth16 = require("snarkjs").groth16


export type BigNumberish = string | bigint

export type SnarkArtifacts = {
    wasmFilePath: string
    zkeyFilePath: string
}

export type SnarkJSProof = {
    pi_a: BigNumberish[]
    pi_b: BigNumberish[][]
    pi_c: BigNumberish[]
    protocol: string
    curve: string
}

export type FullProof = {
    merkleTreeRoot: BigNumberish
    signal: BigNumberish
    nullifierHash: BigNumberish
    externalNullifier: BigNumberish
    proof: Proof
}

export type Proof = [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
]


export function packProof(originalProof: SnarkJSProof): Proof {
  return [
      originalProof.pi_a[0],
      originalProof.pi_a[1],
      originalProof.pi_b[0][1],
      originalProof.pi_b[0][0],
      originalProof.pi_b[1][1],
      originalProof.pi_b[1][0],
      originalProof.pi_c[0],
      originalProof.pi_c[1]
  ]
}
export default async function generateProof(
  identityTrapdoor : BytesLike | Hexable | number | bigint,
  identityNullifier: BytesLike | Hexable | number | bigint,
  externalNullifier: BytesLike | Hexable | number | bigint,
  snarkArtifacts?: SnarkArtifacts
){

  if (!snarkArtifacts) {
    // Construct local file paths
    const wasmFilePath = "/snark-assets/zk_session_account.wasm";
    const zkeyFilePath = "/snark-assets/zk_session_account.zkey";
    snarkArtifacts = { wasmFilePath, zkeyFilePath };
    //   snarkArtifacts = {
    //       wasmFilePath: `${process.env.NEXT_PUBLIC_AA_SESSION_RELAY_URL}/api/aa_session/zk_session_account.wasm`,
    //       zkeyFilePath: `${process.env.NEXT_PUBLIC_AA_SESSION_RELAY_URL}/api/aa_session/zk_session_account.zkey`
    //   }
  }

  const { proof, publicSignals } = await groth16.fullProve(
      {
          identityTrapdoor: identityTrapdoor,
          identityNullifier: identityNullifier,
          externalNullifier: externalNullifier,
      },
      snarkArtifacts.wasmFilePath,
      snarkArtifacts.zkeyFilePath
  )
  const {a,b,c,Input} = await solidityCalldata(proof,publicSignals)
  return {
    proof: [a[0],a[1],b[0][0],b[0][1],b[1][0],b[1][1],c[0],c[1]],
    publicSignals:Input
  }
}

export async function solidityCalldata(_proof:any,_publicSignals:any){
  const calldata = await groth16.exportSolidityCallData(_proof, _publicSignals)
  console.log(calldata)
  const argv = calldata
        .replace(/["[\]\s]/g, "")
        .split(",")
        .map((x:any) => x)

    const a = [argv[0], argv[1]]
    const b = [
        [argv[2], argv[3]],
        [argv[4], argv[5]]
    ]
    const c = [argv[6], argv[7]]
    const Input = []

    for (let i = 8; i < argv.length; i++) {
        Input.push(argv[i])
    }
    
    return { a, b, c, Input }
}