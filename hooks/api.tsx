// src/api.js

export const fetchResourcePackageList = async () => {
    // Simulated API call: GetResourcePackageList
    return [
      { id: 23, name: "Resource Package A" },
      { id: 43, name: "Resource Package B" },
      { id: 53, name: "Resource Package C" },
      { id: 64, name: "Resource Package D" },
      { id: 71, name: "Resource Package E" },
    ];
  };
  
  export const updateResourceGroup = async (action: string, list: string) => {
    // Simulated API call: UpdateResourceGroup
    console.log(`API Call -> Action: ${action}, List: ${list}`);
  };
  
  export const fetchUpdatedQuote = async () => {
    // Simulated API call: GetQuote
    console.log("API Call -> Fetching updated quote...");
  };
  