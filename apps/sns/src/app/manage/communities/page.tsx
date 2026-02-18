import { Card, Section } from "src/components/ui";
import { ContractRegistrationForm } from "src/components/ContractRegistrationForm";
import { CommunityUpdateForm } from "src/components/CommunityUpdateForm";
import { CommunityCloseForm } from "src/components/CommunityCloseForm";

export default async function CommunityManagementPage() {
  return (
    <div className="grid">
      <section className="hero">
        <h1>Create, update, or close your communities.</h1>
        <p>
          Create a new community for your Ethereum DApp for testing. A DApp can
          consist of one or more smart contracts. If there are updates to the
          smart contracts that make up your DApp, you can reflect the latest
          updates in your community. Once you receive sufficient feedback, you
          can close the community.
        </p>
      </section>

      <Section
        title="Create New Community"
        description="Create a community by registering one or more contracts. You need to fill in the minial information about your DApp."
      >
        <Card>
          <ContractRegistrationForm />
        </Card>
      </Section>

      <Section
        title="Update Your Community Details"
        description="Select a community and apply one update purpose at a time."
      >
        <Card>
          <CommunityUpdateForm />
        </Card>
      </Section>

      <Section
        title="Close Your Community"
        description={`Community's status turns to "Closed". A closed community will be completely deleted after 14 days.`}
      >
        <Card>
          <CommunityCloseForm />
        </Card>
      </Section>
    </div>
  );
}
