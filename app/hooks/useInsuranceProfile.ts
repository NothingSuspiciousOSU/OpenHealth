import { useState, useEffect } from "react";

export type InsuranceProfile = {
  providerName: string;
  planName: string;
  deductible: number | "";
  oopMax: number | "";
  copay: number | "";
  coinsurance: number | "";
};

const DEFAULT_PROFILE: InsuranceProfile = {
  providerName: "",
  planName: "",
  deductible: "",
  oopMax: "",
  copay: "",
  coinsurance: "",
};

export function useInsuranceProfile() {
  const [profile, setProfile] = useState<InsuranceProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem("openhealth_insurance_profile");
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved insurance profile", e);
        }
      } else {
        setProfile(DEFAULT_PROFILE);
      }
      setIsLoaded(true);
    };

    loadProfile();

    // Listen for custom event to sync state across different hook instances
    const handleSync = () => loadProfile();
    window.addEventListener("openhealth_profile_updated", handleSync);
    return () => window.removeEventListener("openhealth_profile_updated", handleSync);
  }, []);

  const saveProfile = (newProfile: InsuranceProfile) => {
    setProfile(newProfile);
    localStorage.setItem("openhealth_insurance_profile", JSON.stringify(newProfile));
    window.dispatchEvent(new Event("openhealth_profile_updated"));
  };

  const clearProfile = () => {
    setProfile(DEFAULT_PROFILE);
    localStorage.removeItem("openhealth_insurance_profile");
    window.dispatchEvent(new Event("openhealth_profile_updated"));
  };

  return {
    profile,
    saveProfile,
    clearProfile,
    isLoaded,
  };
}
