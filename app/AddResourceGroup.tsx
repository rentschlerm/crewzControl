import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { JobsContext } from "@/components/JobContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import LogoStyles from "../components/LogoStyles";
import { getDeviceInfo } from "../components/DeviceUtils";
import { XMLParser } from "fast-xml-parser";
import CryptoJS from "crypto-js";
import useLocation from "@/hooks/useLocation";

interface ResourcePackage {
  id: number;
  name: string;
}

const AddResourceGroup: React.FC = () => {
  const router = useRouter();
  const { authorizationCode } = useContext(JobsContext);
  const { location, fetchLocation } = useLocation();
  const { quoteSerial } = useLocalSearchParams();
  const [deviceInfo, setDeviceInfo] = useState<{
    id: string;
    model: string;
    version: string;
    type: string;
    softwareVersion: string | number | boolean;
  } | null>(null);

  const [resourcePackages, setResourcePackages] = useState<ResourcePackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<number>>(new Set());
  const [proceedEnabled, setProceedEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { job } = useLocalSearchParams(); // Fetch the job parameter
  const jobObj = job ? (typeof job === "string" ? JSON.parse(job) : job) : null; // Parse job into jobObj

  // if (!jobObj) {
  //   return <Text>Error: No job data found</Text>; // Handle missing jobObj gracefully
  // }

  useEffect(() => {
    const initialize = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      fetchLocation();
    };

    initialize();
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      if (!deviceInfo || !authorizationCode || !location) {
        return;
      }
      setLoading(true);
      try {
        const crewzControlVersion = "1";
        const currentDate = new Date();
        const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, "0")}/${String(
          currentDate.getDate()
        ).padStart(2, "0")}/${currentDate.getFullYear()}-${String(
          currentDate.getHours()
        ).padStart(2, "0")}:${String(currentDate.getMinutes()).padStart(2, "0")}`;
        const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
        const key = CryptoJS.SHA1(keyString).toString();
  
        const url = `https://CrewzControl.com/dev/CCService/GetResourceGroupList.php?DeviceID=${encodeURIComponent(
          deviceInfo.id
        )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Language=EN`;
  
        console.log("Fetch Resource Groups URL:", url);
        const response = await fetch(url);
        const data = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(data);
        console.log(result);
  
        if (result.ResultInfo?.Result === "Success") {
          const groups =
            Array.isArray(result.ResultInfo.Selections?.ResourceGroup)
              ? result.ResultInfo.Selections.ResourceGroup.map((group: any) => {
                  if (!group || !group.Serial || !group.Name) {
                    // Skip invalid entries
                    console.warn("Invalid ResourceGroup entry:", group);
                    return null;
                  }
                  return {
                    id: parseInt(group.Serial, 10) || -1,
                    name: group.Name || "Unnamed Resource Group",
                  };
                }).filter(Boolean) // Remove null entries
              : [
                  result.ResultInfo.Selections?.ResourceGroup?.Serial &&
                  result.ResultInfo.Selections?.ResourceGroup?.Name
                    ? {
                        id: parseInt(result.ResultInfo.Selections.ResourceGroup.Serial, 10) || -1,
                        name: result.ResultInfo.Selections.ResourceGroup.Name || "Unnamed Resource Group",
                      }
                    : null,
                ].filter(Boolean); // Handle single entry or invalid data
          setResourcePackages(groups);
        } else {
          Alert.alert("Error", result.ResultInfo?.Message || "Failed to fetch resource groups.");
        }
      } catch (error) {
        console.error("Error fetching resource groups:", error);
        Alert.alert("Error", "An error occurred while fetching resource groups.");
      } finally {
        setLoading(false); // Stop loading
      }
    };
  
    fetchResources();
  }, [deviceInfo, authorizationCode, location]);
  

  const toggleSelection = (id: number) => {
    const updatedSelection = new Set(selectedPackages);
    if (updatedSelection.has(id)) {
      updatedSelection.delete(id);
    } else {
      updatedSelection.add(id);
    }
    setSelectedPackages(updatedSelection);
    setProceedEnabled(updatedSelection.size > 0);
  };

  const handleProceed = async () => {
    if (!deviceInfo || !authorizationCode || !location) {
      Alert.alert("Error", "Device info, location, or authorization code is missing.");
      return;
    }
  
    const crewzControlVersion = "1";
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, "0")}/${String(
      currentDate.getDate()
    ).padStart(2, "0")}/${currentDate.getFullYear()}-${String(
      currentDate.getHours()
    ).padStart(2, "0")}:${String(currentDate.getMinutes()).padStart(2, "0")}`;
    const keyString = `${deviceInfo.id}${formattedDate}${authorizationCode}`;
    const key = CryptoJS.SHA1(keyString).toString();
  
    const selectedIds = Array.from(selectedPackages).join(",");
    const updateUrl = `https://CrewzControl.com/dev/CCService/UpdateQuoteResourceGroup.php?DeviceID=${encodeURIComponent(
      deviceInfo.id
    )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Longitude=${location.longitude}&Latitude=${location.latitude}&Action=add&List=${selectedIds || ''}&Quote=${quoteSerial}`;
    console.log("Update Resource Groups URL:", updateUrl);
  
    try {
      const updateResponse = await fetch(updateUrl);
      const updateData = await updateResponse.text();
      const updateParser = new XMLParser();
      const updateResult = updateParser.parse(updateData);
  
      if (updateResult.ResultInfo?.Result === "Success") {
        console.log("Skills updated successfully. Fetching updated quote data...");
  
        // Fetch updated quote details
        const fetchUrl = `https://CrewzControl.com/dev/CCService/GetQuote.php?DeviceID=${encodeURIComponent(
          deviceInfo.id
        )}&Date=${formattedDate}&Key=${key}&AC=${authorizationCode}&CrewzControlVersion=${crewzControlVersion}&Serial=${quoteSerial}&Longitude=${location.longitude}&Latitude=${location.latitude}`;
        const fetchResponse = await fetch(fetchUrl);
        const fetchData = await fetchResponse.text();
        const fetchParser = new XMLParser();
        const fetchResult = fetchParser.parse(fetchData);
  
        if (fetchResult.ResultInfo?.Result === "Success") {
          console.log("Fetched updated quote data:", fetchResult.ResultInfo.Selections.Quote);
  
          router.push({
            pathname: "/ProjectUpdate",
            params: { job: JSON.stringify(fetchResult.ResultInfo.Selections.Quote) },
          });
        } else {
          Alert.alert("Error", fetchResult.ResultInfo?.Message || "Failed to fetch updated quote details.");
        }
      } else {
        Alert.alert("Error", updateResult.ResultInfo?.Message || "Failed to update Skills.");
      }
    } catch (error) {
      console.error("Error updating Skills:", error);
      Alert.alert("Error", "An error occurred while updating Skills.");
    }
  };
  
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../assets/images/background.png")}
        style={styles.background}
      >
        <Image
          source={require("../assets/images/crewzControlIcon.png")}
          style={LogoStyles.logo}
          resizeMode="contain"
        />
  
        <View style={styles.mainDiv}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>  Add Resource Group</Text>
          </View>
  
          {/* Conditional Loading */}
          {loading ? (
            <View style={styles.loadingContainer}>
              {/* <Text style={styles.loadingText}>Loading resource groups...</Text> */}
              {/* Optionally replace the text with a spinner */}
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <>
              {/* FlatList for Resource Groups */}
              <FlatList
                data={resourcePackages}
                keyExtractor={(item, index) =>
                  item.id !== -1 ? item.id.toString() : `key-${index}`
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      selectedPackages.has(item.id)
                        ? styles.itemSelected
                        : styles.itemUnselected,
                    ]}
                    onPress={() => toggleSelection(item.id)}
                  >
                    <Text style={styles.checkbox}>
                      {selectedPackages.has(item.id) ? "☑" : "☐"}
                    </Text>
                    <Text style={styles.itemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    Loading resource groups.
                  </Text>
                )}
              />
            </>
          )}
  
          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleProceed}
              style={[
                styles.proceedButton,
                !proceedEnabled && styles.disabledButton,
              ]}
              disabled={!proceedEnabled}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
  
};
// Stylesheet for the component
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#b0bec5",
    fontSize: 16,
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  mainDiv: {
    flex: 1,
    width: "90%",
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    alignSelf: "center",
    justifyContent: "space-between",
    marginTop: 150, 
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#20D5FF",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  proceedButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#20D5FF",
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#b0bec5",
  },
  proceedButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    width: "90%", // Adjust width relative to the screen
    backgroundColor: "#fff", // White background
    borderRadius: 20, // Rounded edges
    padding: 20, // Padding inside the card
    shadowColor: "#000", // Shadow for elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Elevation for Android
  },
  container: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
    borderRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: "center",
    marginRight: 100,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10
  },
  title: {
    color: "#7B7B7B",
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",

  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  itemSelected: {
    backgroundColor: "#e0f2f1",
    borderColor: "#00796b",
  },
  itemUnselected: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  checkbox: {
    fontSize: 20,
    marginRight: 10,
  },
  itemText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
    paddingHorizontal: 20,
  },
});

export default AddResourceGroup;
