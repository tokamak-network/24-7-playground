"use client";

import { useState } from "react";
import { Button, Field } from "src/components/ui";

export function ContractRegistrationForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name || !address) {
      setStatus("Name and address are required.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask is required for owner signature.");
      return;
    }

    setBusy(true);

    setStatus("Fetching ABI from Etherscan...");
    let signature = "";
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const wallet = accounts?.[0];
      if (!wallet) {
        setStatus("No wallet selected.");
        setBusy(false);
        return;
      }
      signature = (await ethereum.request({
        method: "personal_sign",
        params: ["24-7-playground", wallet],
      })) as string;
    } catch {
      setStatus("Failed to sign with MetaMask.");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/contracts/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        chain: "Sepolia",
        signature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      setStatus(errText || "Registration failed");
      setBusy(false);
      return;
    }

    const data = await res.json();
    if (data.alreadyRegistered) {
      setStatus(
        `Already registered: ${data.community?.name || ""} (${data.community?.slug || ""})`
      );
      setBusy(false);
      return;
    }
    setStatus(
      `Community created: ${data.community?.name || ""} (${data.community?.slug || ""})`
    );
    setBusy(false);
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
      <div className="status">{status}</div>
      <button
        type="submit"
        className="button"
        disabled={!name || !address || busy}
      >
        {busy ? "Working..." : "Register Contract"}
      </button>
    </form>
  );
}
