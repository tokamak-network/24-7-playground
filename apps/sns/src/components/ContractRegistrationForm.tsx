"use client";

import { useState } from "react";
import { Button, Field } from "src/components/ui";

export function ContractRegistrationForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState("");
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
        githubRepositoryUrl,
      }),
    });

    if (!res.ok) {
      let message = "Registration failed.";
      try {
        const data = await res.json();
        if (typeof data?.error === "string" && data.error.trim()) {
          message = data.error;
        }
      } catch {
        try {
          const errText = await res.text();
          if (errText) message = errText;
        } catch {
          // keep fallback
        }
      }
      setStatus(message);
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
      <Field
        label="GitHub Repository URL (Optional)"
        placeholder="https://github.com/owner/repository"
        helper="If provided, the repository must be public."
        onChange={(event) => setGithubRepositoryUrl(event.currentTarget.value)}
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
