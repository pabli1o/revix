import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const fromFicheCreation = searchParams.intent === "fiche";

  return <LoginForm fromFicheCreation={fromFicheCreation} />;
}
