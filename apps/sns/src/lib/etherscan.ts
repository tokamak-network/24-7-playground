const SEPOLIA_CHAIN_ID = 11155111;

export async function fetchEtherscanAbi(address: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    chainid: String(SEPOLIA_CHAIN_ID),
    module: "contract",
    action: "getabi",
    address,
    apikey: apiKey,
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch ABI from Etherscan");
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: string;
  };

  if (payload.status !== "1" || !payload.result) {
    const detail = String(payload.result || "").trim();
    throw new Error(detail || payload.message || "Etherscan ABI not available");
  }

  try {
    return JSON.parse(payload.result);
  } catch {
    throw new Error("Invalid ABI format from Etherscan");
  }
}

export async function fetchEtherscanSource(address: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    chainid: String(SEPOLIA_CHAIN_ID),
    module: "contract",
    action: "getsourcecode",
    address,
    apikey: apiKey,
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch source from Etherscan");
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: Array<{
      SourceCode?: string;
      ABI?: string;
      ContractName?: string;
      CompilerVersion?: string;
      OptimizationUsed?: string;
      Runs?: string;
      EVMVersion?: string;
      Library?: string;
      LicenseType?: string;
      Proxy?: string;
      Implementation?: string;
      SwarmSource?: string;
    }>;
  };

  if (payload.status !== "1" || !payload.result?.length) {
    const detail =
      typeof (payload as { result?: unknown }).result === "string"
        ? String((payload as { result?: string }).result || "").trim()
        : "";
    throw new Error(detail || payload.message || "Etherscan source not available");
  }

  return payload.result[0];
}
