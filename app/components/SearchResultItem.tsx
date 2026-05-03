import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useInsuranceProfile } from "../hooks/useInsuranceProfile";
import { useToast } from "./Toast";

type Procedure = {
  _id: string;
  procedureDescription: string;
  dateOfProcedure: bigint;
  hospitalName: string;
  location: { city: string; state: string };
  insurance: { providerName: string; planName: string };
  billedAmount: bigint;
  allowedAmount: bigint;
  cptCodes?: string[]; // Made optional since they aren't loaded immediately
};

export function SearchResultItem({ procedure }: { procedure: Procedure }) {
  const [expanded, setExpanded] = useState(false);
  const { profile, isLoaded } = useInsuranceProfile();
  const { showToast } = useToast();
  const lineItems = useQuery(api.search.getLineItems, expanded ? { procedureId: procedure._id as any } : "skip");

  const formatCurrency = (dollars: number | bigint) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(dollars));
  };

  const formatDate = (ms: number | bigint) => {
    return new Date(Number(ms)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });
  };

  const isMatchedProfile = isLoaded && profile.providerName === procedure.insurance.providerName && profile.planName === procedure.insurance.planName;
  
  const estimatedCost = isMatchedProfile ? formatCurrency(
    (() => {
      const allowed = Number(procedure.allowedAmount);
      const ded = typeof profile.deductible === "number" ? profile.deductible : 0;
      const oop = typeof profile.oopMax === "number" ? profile.oopMax : Infinity;
      const copay = typeof profile.copay === "number" ? profile.copay : 0;
      const coinsurancePercent = typeof profile.coinsurance === "number" ? profile.coinsurance : 0;

      const costAgainstDeductible = Math.min(ded, allowed);
      const remainingAllowed = Math.max(0, allowed - costAgainstDeductible);
      const costFromCoinsurance = remainingAllowed * (coinsurancePercent / 100);
      
      const totalCost = costAgainstDeductible + costFromCoinsurance + copay;
      return Math.min(oop, totalCost);
    })()
  ) : null;

  return (
    <div className="flex flex-col border-b border-zinc-200 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
      <div 
        className="grid cursor-pointer grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-12 sm:items-center sm:gap-6"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Hospital Column */}
        <div className="sm:col-span-3">
          <div className="font-semibold text-blue-600 dark:text-blue-400">{procedure.hospitalName}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {procedure.location.city}, {procedure.location.state} | {formatDate(procedure.dateOfProcedure)}
          </div>
        </div>

        {/* Procedure Column */}
        <div className="sm:col-span-4">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{procedure.procedureDescription}</div>
        </div>

        {/* Insurance Column */}
        <div className="sm:col-span-2">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{procedure.insurance.providerName}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {procedure.insurance.planName}
          </div>
        </div>

        {/* Amount Column */}
        <div className="flex flex-col items-start sm:col-span-3 sm:items-end">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Allowed: {formatCurrency(procedure.allowedAmount)}
          </div>
          <div className="flex flex-col items-start text-xs text-zinc-500 sm:items-end dark:text-zinc-400 mt-0.5">
            <span>Billed: {formatCurrency(procedure.billedAmount)}</span>
          </div>
          {isMatchedProfile && (
            <div className="mt-1 flex flex-col items-start text-xs sm:items-end">
              <span className="whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">✨ Est. Price: {estimatedCost}</span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-zinc-50 px-4 py-6 shadow-inner dark:bg-zinc-900/50">
          {lineItems === undefined ? (
            <div className="text-sm text-zinc-500">Loading line items...</div>
          ) : lineItems.length === 0 ? (
            <div className="text-sm text-zinc-500">No line items found.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 font-medium">CPT Code</th>
                    <th className="px-4 py-3 font-medium">Service Name</th>
                    <th className="px-4 py-3 text-right font-medium">Units</th>
                    <th className="px-4 py-3 text-right font-medium">Cost/Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {lineItems.map((item) => (
                    <tr key={item._id} className="group/line-item hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-3 font-mono text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          {item.cptCode}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(item.cptCode);
                              showToast(`Copied CPT code: ${item.cptCode}`);
                            }}
                            className="opacity-0 group-hover/line-item:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-blue-500"
                            title="Copy CPT code"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.serviceName || "—"}</div>
                        {item.providerName && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.providerName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.units}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.costPerUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
