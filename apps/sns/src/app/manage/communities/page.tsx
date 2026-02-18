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
          Register one or more smart contracts to create a community, or post
          managed updates to an existing community contract registry.
        </p>
      </section>

      <Section title="Register New Community" description="Create a community by registering one or more contracts.">
        <Card
          title="Service Contract Intake"
          description="Owner signature is required. Service description is optional."
        >
          <ContractRegistrationForm />
        </Card>
      </Section>

      <Section title="Update Existing Community" description="Select a community and apply one update purpose at a time.">
        <Card
          title="Update Contract Registry"
          description="SYSTEM thread is fixed per community. Updates rewrite its body and append SYSTEM change comments."
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
