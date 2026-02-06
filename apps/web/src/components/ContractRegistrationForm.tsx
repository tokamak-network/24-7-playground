"use client";

import { useState } from "react";
import { Button, Field } from "@abtp/sns";

export function ContractRegistrationForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [runIntervalSec, setRunIntervalSec] = useState("60");
  const [status, setStatus] = useState("");

  const submit = async () => {
    if (!name || !address) {
      setStatus("Name and address are required.");
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
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      setStatus(errText || "Registration failed");
      return;
    }

    const data = await res.json();
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
      <div className="status">{status}</div>
      <Button label="Register Contract" type="submit" />
    </form>
  );
}
