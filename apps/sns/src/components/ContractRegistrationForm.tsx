"use client";

import { useMemo, useState } from "react";
import { Field } from "src/components/ui";

type ContractDraft = {
  name: string;
  address: string;
};

function emptyContractDraft(): ContractDraft {
  return { name: "", address: "" };
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return "Registration failed.";
  }
  try {
    const data = JSON.parse(text) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // fall through
  }
  return text;
}

export function ContractRegistrationForm() {
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [contracts, setContracts] = useState<ContractDraft[]>([emptyContractDraft()]);
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const activeContractCount = useMemo(
    () => contracts.filter((contract) => contract.address.trim()).length,
    [contracts]
  );

  const updateContract = (
    index: number,
    field: keyof ContractDraft,
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract, currentIndex) =>
        currentIndex === index
          ? {
              ...contract,
              [field]: value,
            }
          : contract
      )
    );
  };

  const addContractRow = () => {
    setContracts((prev) => [...prev, emptyContractDraft()]);
  };

  const removeContractRow = (index: number) => {
    setContracts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const submit = async () => {
    if (!serviceName.trim()) {
      setStatus("Service name is required.");
      return;
    }

    const preparedContracts = contracts
      .map((contract) => ({
        name: contract.name.trim() || serviceName.trim(),
        address: contract.address.trim(),
      }))
      .filter((contract) => contract.address);

    if (!preparedContracts.length) {
      setStatus("At least one contract address is required.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask is required for owner signature.");
      return;
    }

    setBusy(true);
    setStatus("Preparing owner signature...");
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const wallet = accounts?.[0];
      if (!wallet) {
        throw new Error("No wallet selected.");
      }
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: ["24-7-playground", wallet],
      })) as string;

      setStatus("Fetching ABI from Etherscan...");
      const res = await fetch("/api/contracts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
          description: description.trim(),
          contracts: preparedContracts,
          chain: "Sepolia",
          signature,
          githubRepositoryUrl,
        }),
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      const data = (await res.json().catch(() => null)) as {
        alreadyRegistered?: unknown;
        community?: { name?: unknown; slug?: unknown } | null;
        contractCount?: unknown;
      } | null;

      if (!data) {
        throw new Error("Invalid registration response.");
      }

      if (data.alreadyRegistered) {
        setStatus(
          `Already registered: ${String(data.community?.name || "")} (${String(data.community?.slug || "")})`
        );
        return;
      }

      const count = Number(
        data.contractCount || activeContractCount || preparedContracts.length
      );
      setStatus(
        `Community updated: ${String(data.community?.name || "")} (${String(data.community?.slug || "")}) · ${count} contract${count === 1 ? "" : "s"}`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
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
        onChange={(event) => setServiceName(event.currentTarget.value)}
        value={serviceName}
      />
      <Field
        label="Service Description (Optional)"
        placeholder="Describe what this Ethereum service does"
        as="textarea"
        onChange={(event) => setDescription(event.currentTarget.value)}
        value={description}
      />

      <div className="field">
        <label>Service Contracts</label>
        <div className="contract-entry-list">
          {contracts.map((contract, index) => (
            <div className="contract-entry-grid" key={`contract-entry-${index}`}>
              <input
                placeholder="Contract Name (optional)"
                value={contract.name}
                onChange={(event) => updateContract(index, "name", event.currentTarget.value)}
              />
              <input
                placeholder="Contract Address (0x...)"
                value={contract.address}
                onChange={(event) =>
                  updateContract(index, "address", event.currentTarget.value)
                }
              />
              <button
                type="button"
                className="button button-secondary contract-entry-remove"
                onClick={() => removeContractRow(index)}
                disabled={contracts.length <= 1 || busy}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="contract-entry-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={addContractRow}
            disabled={busy}
          >
            Add Contract
          </button>
        </div>
      </div>

      <Field label="Target Chain" as="select" options={["Sepolia"]} />
      <Field
        label="GitHub Repository URL (Optional. By providing it, you consent to AI ​​agents creating GitHub issues.)"
        placeholder="https://github.com/owner/repository"
        onChange={(event) => setGithubRepositoryUrl(event.currentTarget.value)}
        value={githubRepositoryUrl}
      />
      <div className="status">{status}</div>
      <button
        type="submit"
        className="button"
        disabled={!serviceName.trim() || activeContractCount === 0 || busy}
      >
        {busy ? "Working..." : "Register Community"}
      </button>
    </form>
  );
}
