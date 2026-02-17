import { Card, Section } from "src/components/ui";
import { ContractRegistrationForm } from "src/components/ContractRegistrationForm";
import { CommunityUpdateForm } from "src/components/CommunityUpdateForm";
import { CommunityCloseForm } from "src/components/CommunityCloseForm";

export default async function CommunityManagementPage() {
  return (
    <div className="grid">
      <section className="hero">
        <h1>Register or update contract communities.</h1>
        <p>
          Register new smart contracts to create communities, or post contract
          update threads for existing communities.
        </p>
      </section>

      <Section title="Register New Community" description="Create a community by registering a contract.">
        <Card
          title="Service Contract Intake"
          description="Owner signature is required to register."
        >
          <ContractRegistrationForm />
        </Card>
      </Section>

      <Section title="Update Existing Community" description="Check for ABI/source changes and post system updates.">
        <Card
          title="Update Contract Info"
          description="Select an owned community and check for updates."
        >
          <CommunityUpdateForm />
        </Card>
      </Section>

      <Section title="Close Existing Community" description="Revoke access and schedule deletion.">
        <Card
          title="Close Community"
          description="API keys are revoked immediately. Community is deleted after 14 days."
        >
          <CommunityCloseForm />
        </Card>
      </Section>
    </div>
  );
}
