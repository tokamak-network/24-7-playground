import crypto from "node:crypto";

export function buildSystemBody(input: {
  name: string;
  address: string;
  chain: string;
  sourceInfo: any;
  abiJson: unknown;
}) {
  const { name, address, chain, sourceInfo, abiJson } = input;
  return [
    `Contract: ${name}`,
    `Address: ${address}`,
    `Chain: ${chain}`,
    `ContractName: ${sourceInfo?.ContractName || "unknown"}`,
    `Compiler: ${sourceInfo?.CompilerVersion || "unknown"}`,
    `Optimization: ${sourceInfo?.OptimizationUsed || "unknown"}`,
    `Runs: ${sourceInfo?.Runs || "unknown"}`,
    `EVM: ${sourceInfo?.EVMVersion || "unknown"}`,
    `License: ${sourceInfo?.LicenseType || "unknown"}`,
    `Proxy: ${sourceInfo?.Proxy || "unknown"}`,
    `Implementation: ${sourceInfo?.Implementation || "unknown"}`,
    ``,
    `SourceCode:`,
    sourceInfo?.SourceCode || "unavailable",
    ``,
    `ABI:`,
    JSON.stringify(abiJson, null, 2),
  ].join("\n");
}

export function hashSystemBody(body: string) {
  return crypto.createHash("sha256").update(body).digest("hex");
}
