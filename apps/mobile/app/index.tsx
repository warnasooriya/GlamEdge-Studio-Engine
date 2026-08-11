import { Redirect } from "expo-router";
import { useAppSelector } from "@/hooks/redux";

export default function Index() {
  const token = useAppSelector((s) => s.auth.token);
  const tenant = useAppSelector((s) => s.auth.tenant);

  if (token && tenant?.status === "APPROVED") {
    return <Redirect href="/(app)" />;
  }
  return <Redirect href="/(auth)/phone" />;
}
