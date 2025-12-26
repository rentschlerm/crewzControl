import { Stack } from "expo-router";
import { JobsProvider } from "../components/JobContext"; 
import { QuoteProvider } from "../components/QuoteContext";
import { initDebug } from '../components/Debug';

export default function RootLayout() {
  // Initialize debug behavior (overrides console methods when flagged off)
  initDebug();
  return (


    <JobsProvider>
      <QuoteProvider>
        
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
      
    </JobsProvider>


  );
}
