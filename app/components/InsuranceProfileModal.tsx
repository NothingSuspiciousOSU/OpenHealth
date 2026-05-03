import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useInsuranceProfile, InsuranceProfile } from "../hooks/useInsuranceProfile";

type InsuranceProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function InsuranceProfileModal({ isOpen, onClose }: InsuranceProfileModalProps) {
  const { profile, saveProfile, clearProfile } = useInsuranceProfile();
  
  const [provider, setProvider] = useState("");
  const [plan, setPlan] = useState("");
  const [deductible, setDeductible] = useState<number | "">("");
  const [oopMax, setOopMax] = useState<number | "">("");
  const [copay, setCopay] = useState<number | "">("");
  const [coinsurance, setCoinsurance] = useState<number | "">("");

  const filterOptions = useQuery(api.search.getFilterOptions);
  
  const insuranceProviders = filterOptions ? Object.keys(filterOptions.insurances).sort() : [];
  const insurancePlans = filterOptions && provider && filterOptions.insurances[provider] 
    ? Array.from(filterOptions.insurances[provider]).sort() : [];

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProvider(profile.providerName);
      setPlan(profile.planName);
      setDeductible(profile.deductible);
      setOopMax(profile.oopMax);
      setCopay(profile.copay);
      setCoinsurance(profile.coinsurance);
    }
  }, [isOpen, profile]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    saveProfile({
      providerName: provider.trim(),
      planName: plan.trim(),
      deductible: deductible,
      oopMax: oopMax,
      copay: copay,
      coinsurance: coinsurance,
    });
    onClose();
  };

  const handleClear = () => {
    clearProfile();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="insurance-modal-title">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕
        </button>

        <h2 id="insurance-modal-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          My Insurance Profile
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Set your insurance details to automatically see estimated prices on matching procedures.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Provider</label>
              <select
                value={provider}
                onChange={(e) => { setProvider(e.target.value); setPlan(""); }}
                className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800"
              >
                <option value="">Select a Provider</option>
                {insuranceProviders.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                disabled={!provider}
                className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 disabled:opacity-50"
              >
                <option value="">Select a Plan</option>
                {insurancePlans.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <div>
              <label 
                className="mb-1 block text-xs font-medium text-zinc-500 cursor-help"
                title="The amount you pay out-of-pocket for covered health care services before your insurance plan starts to pay."
              >
                Remaining Deductible ($)
              </label>
              <input
                type="number"
                min="0"
                value={deductible}
                onChange={(e) => setDeductible(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="0.00"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label 
                  className="mb-1 block text-xs font-medium text-zinc-500 cursor-help"
                  title="A fixed amount you pay for a covered health care service after you've paid your deductible."
                >
                  Co-pay ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={copay}
                  onChange={(e) => setCopay(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="0.00"
                />
              </div>
              <div className="flex-1">
                <label 
                  className="mb-1 block text-xs font-medium text-zinc-500 cursor-help"
                  title="The percentage of costs of a covered health care service you pay after you've paid your deductible."
                >
                  Co-insurance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coinsurance}
                  onChange={(e) => setCoinsurance(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="20"
                />
              </div>
            </div>

            <div>
              <label 
                className="mb-1 block text-xs font-medium text-zinc-500 cursor-help"
                title="The most you have to pay for covered services in a plan year. After you spend this amount, your health plan pays 100% of the costs."
              >
                Remaining Out-of-Pocket Max ($)
              </label>
              <input
                type="number"
                min="0"
                value={oopMax}
                onChange={(e) => setOopMax(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
          >
            Clear Profile
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
