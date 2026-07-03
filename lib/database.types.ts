export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "timekeeper" | "admin" | "super_admin";
export type AttendanceAction = "check_in" | "check_out";
export type AttendanceStatus = "open" | "complete" | "incomplete" | "corrected";
export type PayrollStatus = "pending" | "approved" | "on_hold" | "paid";

type RowTable<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRow {
  id: string;
  employee_id_pin: string | null;
  full_name: string;
  trade_role: string | null;
  crew: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteRow {
  id: string;
  site_code: string;
  name: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSessionRow {
  id: string;
  employee_id: string;
  site_id: string;
  work_date: string;
  employee_name_snapshot: string;
  employee_id_pin_snapshot: string | null;
  site_name_snapshot: string;
  site_code_snapshot: string;
  check_in_event_id: string;
  check_out_event_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_in_accuracy_metres: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_accuracy_metres: number | null;
  check_in_by: string;
  check_out_by: string | null;
  worked_minutes: number | null;
  overtime_check: boolean | null;
  assignment_check: boolean | null;
  payroll_status: PayrollStatus | null;
  notes: string | null;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: RowTable<
        ProfileRow,
        Pick<ProfileRow, "id" | "username" | "display_name" | "role"> &
          Partial<Pick<ProfileRow, "is_active">>
      >;
      employees: RowTable<
        EmployeeRow,
        Pick<EmployeeRow, "full_name"> &
          Partial<
            Pick<
              EmployeeRow,
              | "id"
              | "employee_id_pin"
              | "trade_role"
              | "crew"
              | "is_active"
              | "created_by"
              | "updated_by"
            >
          >
      >;
      sites: RowTable<
        SiteRow,
        Pick<SiteRow, "site_code" | "name"> &
          Partial<
            Pick<
              SiteRow,
              "id" | "is_active" | "created_by" | "updated_by"
            >
          >
      >;
      attendance_sessions: RowTable<AttendanceSessionRow, never>;
    };
    Views: Record<string, never>;
    Functions: {
      record_attendance_scan: {
        Args: {
          p_raw_token: string;
          p_site_id: string;
          p_action: AttendanceAction;
          p_device_captured_at: string;
          p_latitude: number;
          p_longitude: number;
          p_accuracy_metres: number;
          p_location_captured_at: string;
          p_idempotency_key: string;
        };
        Returns: Json;
      };
      update_attendance_manual_fields: {
        Args: {
          p_session_id: string;
          p_overtime_check: boolean | null;
          p_assignment_check: boolean | null;
          p_payroll_status: PayrollStatus | null;
          p_notes: string | null;
        };
        Returns: AttendanceSessionRow;
      };
    };
    Enums: {
      app_role: AppRole;
      attendance_action: AttendanceAction;
      attendance_status: AttendanceStatus;
      payroll_status: PayrollStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
