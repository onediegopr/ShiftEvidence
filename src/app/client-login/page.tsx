import { redirect } from "next/navigation";

export default async function ClientLoginPage() {
  redirect("/sign-in");
}
