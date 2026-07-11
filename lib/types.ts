/** Shapes do contrato (CAPIVAREX — seção 5 da especificação). */

export type Decision = "approved" | "rejected";
export type PendingStatus = "pending" | Decision;

export interface ProductIdea {
  id: string;
  product_name: string;
  idea_summary: string;
  research_summary: Record<string, unknown> | string | null;
  status: PendingStatus;
  decided_by?: string | null;
  decision_note?: string | null;
  created_at: string;
  decided_at?: string | null;
}

export interface SpendingRequest {
  id: string;
  agent: string;
  product: string;
  action: string;
  estimated_cost: number;
  currency: string;
  status: PendingStatus;
  decided_by?: string | null; // "ATLAS" = cérebro decidiu; "henrique" = você
  decision_note?: string | null; // parecer do ATLAS ("DECISAO: ...")
  requested_at: string;
  decided_at?: string | null;
}

export interface AgentInfo {
  agent_key: string;
  name: string;
  role: string;
  webhook_path: string;
  primary_inputs: string;
  category: string;
  active: boolean;
}

export interface WorkLogEntry {
  id: string;
  run_id: string | null;
  agent: string;
  product: string | null;
  phase: string | null;
  action: string;
  summary: string | null;
  status: "done" | "skipped" | "error";
  created_at: string;
}

export interface AgentLearning {
  id: string;
  agent: string;
  product?: string | null;
  kind: "reflection" | "feedback" | "result" | "example";
  lesson: string;
  created_at: string;
}

export interface BrandContext {
  id: string;
  product_slug?: string;
  product_name?: string;
  [key: string]: unknown;
}

export interface CfoSummary {
  total_gross: number;
  total_company_share: number;
  total_pro_labore_share: number;
  transaction_count: number;
  by_currency: Record<string, { total_gross?: number; count?: number } | number>;
  pending_classification: {
    count: number;
    total_gross: number;
    products: string[];
  };
  pending_spending_requests: number;
}

export interface BuscaOpportunity {
  id: string;
  title: string;
  status: string;
  score_total: number | null;
  [key: string]: unknown;
}

export interface CeoChatResponse {
  agent: string;
  reply: string;
  timestamp: string;
}

export interface ApprovalsCount {
  ideas: number;
  spending: number;
  total: number;
}

/** Shapes da esteira / Bloco de Junção (seção 9 da especificação). */

export type RunStatus = "running" | "awaiting_gate" | "done" | "aborted" | "error";

export interface OrchestrationRun {
  id: string;
  product_name: string;
  phase: string | null;
  gate: string | null;
  status: RunStatus;
  data?: Record<string, unknown> | null;
  last_summary?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/** Shapes da Revisão de Criação (seção 10 da especificação). */

export type AssetType =
  | "copy"
  | "image"
  | "video"
  | "landing"
  | "email"
  | "social_post"
  | "ads"
  | "seo";

export interface CreationAsset {
  id: string;
  asset_key: string;
  run_id: string;
  product_name?: string | null;
  agent: string;
  asset_type: AssetType;
  title?: string | null;
  content_text?: string | null;
  media_url?: string | null;
  status: PendingStatus;
  decided_by?: string | null;
  decision_note?: string | null;
  created_at: string;
  decided_at?: string | null;
}

export interface GateApproval {
  id: string;
  run_id: string;
  product_name?: string | null;
  phase?: string | null;
  gate: string;
  summary?: string | null;
  payload?: Record<string, unknown> | null;
  status: PendingStatus;
  decided_by?: string | null;
  decision_note?: string | null;
  created_at: string;
  decided_at?: string | null;
}
