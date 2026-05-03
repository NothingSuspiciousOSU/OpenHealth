export type ProcedureFormData = {
  procedureDescription: string;
  dateOfProcedure: string;
  hospitalName: string;
  location: {
    city: string;
    state: string;
  };
  insurance: {
    providerName: string;
    planName: string;
  };
  billedAmount: string;
  allowedAmount: string;
};

export type CptLineItemDraft = {
  cptCode: string;
  serviceName: string;
  units: string;
  costPerUnit: string;
};

export function createEmptyCptLineItem(): CptLineItemDraft {
  return {
    cptCode: '',
    serviceName: '',
    units: '',
    costPerUnit: '',
  };
}