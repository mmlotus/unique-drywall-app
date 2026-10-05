export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;

  billing_address_line1: string;
  billing_address_line2: string | null;
  billing_city: string;
  billing_state: string;
  billing_zip: string;

  job_address_line1: string;
  job_address_line2: string | null;
  job_city: string;
  job_state: string;
  job_zip: string;

  notes: string | null;
  is_archived: boolean;

  created_at: string;
  updated_at: string;
};

export type CustomerFormData = {
  name: string;
  phone: string;
  email: string;

  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingZip: string;

  jobAddressLine1: string;
  jobAddressLine2: string;
  jobCity: string;
  jobState: string;
  jobZip: string;

  notes: string;
};