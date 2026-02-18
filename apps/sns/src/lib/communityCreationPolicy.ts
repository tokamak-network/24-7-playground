import { Contract, JsonRpcProvider } from "ethers";

const TON_ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
] as const;

export const TEMP_COMMUNITY_CREATION_POLICY = {
  sepoliaChainId: 11155111,
  tonTokenAddress: "0xa30fe40285B8f5c0457DbC3B7C8A280373c40044",
  minTonWholeBalance: 1200n,
  maxCommunitiesPerWallet: 3,
} as const;

type TonHoldingEligibility = {
  eligible: boolean;
  reason?: string;
  balanceRaw?: bigint;
  requiredRaw?: bigint;
  decimals?: number;
};

function pow10(exponent: number) {
  let value = 1n;
  for (let i = 0; i < exponent; i += 1) {
    value *= 10n;
  }
  return value;
}

function getSepoliaRpcUrl() {
  const explicit =
    process.env.SEPOLIA_RPC_URL?.trim() ||
    process.env.ALCHEMY_SEPOLIA_RPC_URL?.trim() ||
    process.env.SNS_SEPOLIA_RPC_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const alchemyApiKey = process.env.ALCHEMY_API_KEY?.trim();
  if (alchemyApiKey) {
    return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  }
  return "";
}

export async function verifyTonHoldingEligibility(
  walletAddress: string
): Promise<TonHoldingEligibility> {
  const rpcUrl = getSepoliaRpcUrl();
  if (!rpcUrl) {
    return {
      eligible: false,
      reason: "Community creation policy check is unavailable (missing Sepolia RPC URL).",
    };
  }

  try {
    const provider = new JsonRpcProvider(
      rpcUrl,
      TEMP_COMMUNITY_CREATION_POLICY.sepoliaChainId
    );
    const tonContract = new Contract(
      TEMP_COMMUNITY_CREATION_POLICY.tonTokenAddress,
      TON_ERC20_ABI,
      provider
    );

    const [balanceRaw, decimalsRaw] = await Promise.all([
      tonContract.balanceOf(walletAddress) as Promise<bigint>,
      tonContract.decimals() as Promise<number>,
    ]);

    const decimals = Number(decimalsRaw);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      return {
        eligible: false,
        reason: "Community creation policy check failed (invalid TON decimals).",
      };
    }

    const requiredRaw =
      TEMP_COMMUNITY_CREATION_POLICY.minTonWholeBalance * pow10(decimals);
    const eligible = balanceRaw >= requiredRaw;

    return {
      eligible,
      reason: eligible
        ? undefined
        : `Community creation requires at least ${TEMP_COMMUNITY_CREATION_POLICY.minTonWholeBalance.toString()} TON on Sepolia.`,
      balanceRaw,
      requiredRaw,
      decimals,
    };
  } catch {
    return {
      eligible: false,
      reason:
        "Community creation policy check is unavailable (failed to read TON balance on Sepolia).",
    };
  }
}
