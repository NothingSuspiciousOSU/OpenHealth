import type { ChangeEvent } from 'react';
import type { ProcedureFormData } from '../types';
import {
  fieldLabelClasses,
  inputClasses,
  sectionCardClasses,
  sectionDescriptionClasses,
  sectionTitleClasses,
} from './formStyles';

type ProcedureDetailsSectionProps = {
  formData: ProcedureFormData;
  isLoading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export function ProcedureDetailsSection({ formData, isLoading, onChange }: ProcedureDetailsSectionProps) {
  return (
    <div className={sectionCardClasses}>
      <div className="mb-4">
        <h2 className={sectionTitleClasses}>Procedure Information</h2>
        <p className={sectionDescriptionClasses}>Confirm the core details extracted from the document.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={fieldLabelClasses}>
            Procedure Description *
          </label>
          <textarea
            name="procedureDescription"
            value={formData.procedureDescription}
            onChange={onChange}
            rows={3}
            disabled={isLoading}
            className={inputClasses}
            placeholder="Describe the procedure"
          />
        </div>

        <div>
          <label className={fieldLabelClasses}>
            Date of Procedure *
          </label>
          <input
            type="date"
            name="dateOfProcedure"
            value={formData.dateOfProcedure}
            onChange={onChange}
            disabled={isLoading}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={fieldLabelClasses}>Hospital Name *</label>
          <input
            type="text"
            name="hospitalName"
            value={formData.hospitalName}
            onChange={onChange}
            disabled={isLoading}
            className={inputClasses}
            placeholder="Enter hospital name"
          />
        </div>
      </div>
    </div>
  );
}