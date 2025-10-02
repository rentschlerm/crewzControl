import { Stack } from "expo-router";
import { JobsProvider, useJobs } from "../components/JobContext"; 
import { QuoteProvider } from "../components/QuoteContext";

function AppContent() {
  const { deviceInfo, authorizationCode } = useJobs();
  
  return (
    <QuoteProvider deviceInfo={deviceInfo} authorizationCode={authorizationCode}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="SecurityCodeScreen" options={{ headerShown: false }}/>
        <Stack.Screen name="Project" options={{ headerShown: false }}/>
        <Stack.Screen name="ProjectUpdate" options={{ headerShown: false }}/>
        <Stack.Screen name="SearchResults" options={{ headerShown: false }}/>
        <Stack.Screen name="AlternativeSelection" options={{ headerShown: false }}/>
        <Stack.Screen name="AddResourceGroup" options={{ headerShown: false }}/>
        <Stack.Screen name="AddEquipmentsGroup" options={{ headerShown: false }}/>
        <Stack.Screen name="AddSkillsGroup" options={{ headerShown: false }}/>
      </Stack>
    </QuoteProvider>
  );
}

export default function RootLayout() {
  return (
    <JobsProvider>
      <AppContent />
    </JobsProvider>
  );
}
