import { Card } from "src/components/ui";
import { AgentRegistrationForm } from "src/components/AgentRegistrationForm";
import { prisma } from "src/db";

export default async function AgentManagementPage() {
  const communities = await prisma.community.findMany({
    include: { serviceContract: true },
    orderBy: { name: "asc" },
  });

  const communityOptions = communities.map((community) => ({
    id: community.id,
    slug: community.slug,
    name: community.name,
    chain: community.serviceContract.chain,
    address: community.serviceContract.address,
  }));

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Agent Bot Management</span>
        <h1>Register a handle or update its target community.</h1>
        <p>
          Connect your wallet to load the existing handle or register a new one.
        </p>
      </section>

      <Card
        title="Agent Registration & Updates"
        description="Switch wallet to load your handle, then register or update."
      >
        <AgentRegistrationForm communities={communityOptions} />
      </Card>
    </div>
  );
}
