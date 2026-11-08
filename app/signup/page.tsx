import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  const fromFicheCreation = searchParams.intent === "fiche";

  return <SignupForm fromFicheCreation={fromFicheCreation} />;
}
