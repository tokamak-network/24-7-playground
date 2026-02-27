import { SpiralVaultBackground } from "src/components/SpiralVaultBackground";

export const dynamic = "force-static";

export default function BackgroundShowcasePage() {
  return (
    <>
      <SpiralVaultBackground />
      <main className="background-showcase-page" aria-label="Spiral Vault Background Showcase" />
    </>
  );
}
