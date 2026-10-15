import { ReactNode } from "react";
import { Material } from "./materials";

export type AppModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  notice?: string | null;
};

export type CreateEstimateBody = {
  customerId?: string;
  builderFirmId?: string | null;
  estimateDate?: string;
  jobName?: string;
  jobSiteAddress?: string;
  jobSiteCity?: string;
  jobSiteState?: string;
  jobSiteZip?: string;
  primaryContactType?: "customer" | "builder" | "custom";
  customContactName?: string;
  customContactPhone?: string;
  customContactEmail?: string;
  notes?: string;
};

export type UpdateEstimateBody = {
  currentStep?: number;
  estimateNumber?: string | null;
  customerId?: string;
  builderFirmId?: string | null;
  estimateDate?: string;
  jobName?: string | null;
  jobSiteAddress?: string | null;
  jobSiteCity?: string | null;
  jobSiteState?: string | null;
  jobSiteZip?: string | null;
  primaryContactType?: "customer" | "builder" | "custom";
  customContactName?: string | null;
  customContactPhone?: string | null;
  customContactEmail?: string | null;
  notes?: string | null;
};

export type EstimateRouteContext = {
  params: Promise<{ id: string }>;
};

export type EstimateStatus = "draft" | "finalized" | "accepted" | "denied";

export type UpdateEstimateStatusBody = {
  status: "finalized" | "accepted" | "denied";
};

export type CreateEstimateRevisionBody = {
  notes?: string | null;
};

export type EstimateSummary = {
  id: string;
  estimate_number: string | null;
  customer_id: string;
  builder_firm_id: string | null;
  estimate_date: string;
  status: EstimateStatus;
  job_name: string | null;
  job_site_address: string | null;
  job_site_city: string | null;
  job_site_state: string | null;
  job_site_zip: string | null;
  primary_contact_type: "customer" | "builder" | "custom";
  current_revision: number;
  created_at: string;
  updated_at: string;
};

export type EstimateContactOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_archived: boolean;
};

export const emptyEstimateFormData: CreateEstimateBody = {
  customerId: "",
  builderFirmId: "",
  estimateDate: "",
  jobName: "",
  jobSiteAddress: "",
  jobSiteCity: "",
  jobSiteState: "",
  jobSiteZip: "",
  primaryContactType: "customer",
  customContactName: "",
  customContactPhone: "",
  customContactEmail: "",
  notes: "",
};

export type EstimateDetail = EstimateSummary & {
  current_step: number;
  custom_contact_name: string | null;
  custom_contact_phone: string | null;
  custom_contact_email: string | null;
  notes: string | null;
  accepted_at: string | null;
  denied_at: string | null;
};

export type EstimateStepNavProps = {
  currentStep: number;
  saving?: boolean;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  exitDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
  onFinalize: () => void;
};

/* AREAS */
export type EstimateArea = {
  id: string;
  estimate_id: string;

  area_id: string | null;
  area_name: string;

  instance_number: number;
  display_label: string;
  display_order: number;

  notes: string | null;
};

export type CreateEstimateAreaBody = {
  areaId?: string;
  name?: string;
  notes?: string;
  saveToLibrary?: boolean;
};

export type EstimateAreaRouteContext = {
  params: Promise<{
    id: string;
    areaId: string;
  }>;
};

export type UpdateEstimateAreaBody = {
  displayLabel?: string;
  notes?: string | null;
};

/* MEASUREMENTS */
export type MeasurementType = "wall" | "ceiling" | "other";

export interface MeasurementDimensions {
  measurementType: MeasurementType;
  lengthFt: number | null;
  widthFt: number | null;
  heightFt: number | null;
  quantity: number;
}

export interface MeasurementCalculations {
  squareFeet: number | null;
  linearFeet: number | null;
}

export interface EstimateMeasurement {
  id: string;
  estimate_area_id: string;
  measurement_type: MeasurementType;
  description: string | null;
  length_ft: number | null;
  width_ft: number | null;
  height_ft: number | null;
  quantity: number;
  square_feet: number | null;
  linear_feet: number | null;
  override_square_feet: boolean;
  override_linear_feet: boolean;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateMeasurementInput {
  estimateAreaId: string;
  measurementType: MeasurementType;
  description?: string | null;
  lengthFt?: number | null;
  widthFt?: number | null;
  heightFt?: number | null;
  quantity: number;
  squareFeet?: number | null;
  linearFeet?: number | null;
  overrideSquareFeet?: boolean;
  overrideLinearFeet?: boolean;
  notes?: string | null;
}

export interface EstimateMeasurementRouteContext {
  params: Promise<{ id: string; measurementId: string }>;
}

export type MeasurementForm = {
  measurementType: MeasurementType;
  description: string;
  lengthFt: string;
  widthFt: string;
  heightFt: string;
  quantity: string;
  squareFeet: string;
  linearFeet: string;
  notes: string;
  overrideSquareFeet: boolean;
  overrideLinearFeet: boolean;
};

export const emptyMeasurementForm: MeasurementForm = {
  measurementType: "wall",
  description: "",
  lengthFt: "",
  widthFt: "",
  heightFt: "",
  quantity: "1",
  squareFeet: "",
  linearFeet: "",
  notes: "",
  overrideSquareFeet: false,
  overrideLinearFeet: false,
};

export type EstMeasurementsStepProps = {
  estimateId: string;
  editable: boolean;
  onDraftChange?: (hasDraft: boolean) => void;
  onBusyChange?: (isBusy: boolean) => void;
};


/* MATERIALS */
export type EstimateMaterial = {
  id: string;
  estimate_area_id: string;
  material_id: string;
  material_variant_id: string | null;
  material_name: string;
  variant_name: string | null;
  unit_name: string | null;
  calculation_method: Material["calculation_method"] | null;
  calculation_settings: Record<string, unknown>;
  suggested_quantity: number | null;
  quantity: number;
  quantity_overridden: boolean;
  coverage_per_unit: number | null;
  total_coverage: number | null;
  unit_cost: number | null;
  unit_price: number | null;
  markup_percent: number | null;
  line_total: number;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateEstimateMaterialBody = {
  estimateAreaId: string;
  materialId: string;
  materialVariantId?: string | null;
  quantity?: number;
  notes?: string | null;
};

export type UpdateEstimateMaterialBody = {
  quantity?: number;
  notes?: string | null;
};

export type EstimateMaterialRouteContext = {
  params: Promise<{ id: string; estMatId: string }>;
};

export type EstMaterialsStepProps = {
  estimateId: string;
  editable: boolean;
  onDraftChange?: (hasDraft: boolean) => void;
  onBusyChange?: (isBusy: boolean) => void;
};


/* REVIEW */
export type EstReviewStepProps = {
  estimateId: string;
  estimate: EstimateDetail;
  customers: EstimateContactOption[];
  builders: EstimateContactOption[];
  editable: boolean;
  onEstimateUpdated: (estimate: EstimateDetail) => void;
  onBusyChange: (busy: boolean) => void;
};