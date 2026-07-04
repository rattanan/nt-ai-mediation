import { LandingPage } from "@/components/landing/landing-page";
import { TopTrustedMediators } from "@/components/landing/top-trusted-mediators";

export default function Page() {
  return <LandingPage trustedMediatorsSection={<TopTrustedMediators />} />;
}
