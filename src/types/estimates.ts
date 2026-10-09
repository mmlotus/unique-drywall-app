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

export type EstimateStatus = "draft" | "accepted" | "denied";

export type UpdateEstimateStatusBody = {
  status: "accepted" | "denied";
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
  custom_contact_name: string | null;
  custom_contact_phone: string | null;
  custom_contact_email: string | null;
  notes: string | null;
  accepted_at: string | null;
  denied_at: string | null;
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