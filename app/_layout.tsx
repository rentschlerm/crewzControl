import { Stack } from "expo-router";
import { JobsProvider } from "../components/JobContext"; 

export default function RootLayout() {
  return (
    <JobsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="Project" />
        <Stack.Screen name="ProjectUpdate" />
        <Stack.Screen name="SearchResults" />
        <Stack.Screen name="AlternativeSelection" />
      </Stack>
    </JobsProvider>
  );
}
