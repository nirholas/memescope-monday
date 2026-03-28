import SubmitForm from "@/templates/tailspark/landing/components/submit";
import pagejson from "@/pagejson/en.json";

export async function generateMetadata() {
  return {
    title: `Submit a Coin | ${pagejson?.metadata?.title}`,
    description: "Submit your memecoin to the Memescope Monday directory",
  };
}

export default function () {
  return <SubmitForm />;
}
