import { Redirect } from "expo-router";
import { useAppSelector } from "../store/hooks";

export default function Index() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(screens)/OnBoardingSlider" />;
}
