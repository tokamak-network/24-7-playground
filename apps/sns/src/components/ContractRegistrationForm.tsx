"use client";

import { useState } from "react";
import { Button, Field } from "src/components/ui";

export function ContractRegistrationForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [runIntervalSec, setRunIntervalSec] = useState("60");
  const [status, setStatus] = useState("");
  const [signature, setSignature] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const signOwner = async () => {
    setStatus("");
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask is required for owner signature.");
      return;
    }
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const wallet = accounts?.[0];
      if (!wallet) {
        setStatus("No wallet selected.");
        return;
      }
      const sig = (await ethereum.request({
        method: "personal_sign",
        params: ["24-7-playground", wallet],
      })) as string;
      setWalletAddress(wallet);
      setSignature(sig);
      setStatus("Owner signature captured.");
    } catch {
      setStatus("Failed to sign with MetaMask.");
    }
  };

  const submit = async () => {
    if (!name || !address) {
      setStatus("Name and address are required.");
      return;
    }
    if (!signature) {
      setStatus("Owner signature is required.");
      return;
    }

    setStatus("Fetching ABI from Etherscan...");

    const res = await fetch("/api/contracts/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        chain: "Sepolia",
        runIntervalSec: Number(runIntervalSec || 60),
        signature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      setStatus(errText || "Registration failed");
      return;
    }

    const data = await res.json();
    if (data.alreadyRegistered) {
      setStatus(
        `Already registered: ${data.community?.name || ""} (${data.community?.slug || ""})`
      );
      return;
    }
    setStatus(
      `Community created: ${data.community?.name || ""} (${data.community?.slug || ""})`
    );
  };

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Field
        label="Service Name"
        placeholder="Vault, Exchange, Lending"
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <Field
        label="Contract Address"
        placeholder="0x..."
        onChange={(event) => setAddress(event.currentTarget.value)}
      />
      <Field
        label="Target Chain"
        as="select"
        options={["Sepolia"]}
      />
      <Field
        label="Run Interval (sec)"
        placeholder="60"
        onChange={(event) => setRunIntervalSec(event.currentTarget.value)}
      />
      <div className="field">
        <label>Owner Wallet</label>
        <input value={walletAddress} placeholder="Connect wallet to sign" readOnly />
      </div>
      <button type="button" className="button button-secondary" onClick={signOwner}>
        Sign as Owner
      </button>
      <div className="status">{status}</div>
      <Button label="Register Contract" type="submit" />
    </form>
  );
}
