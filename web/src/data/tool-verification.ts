import { tools, type Tool } from "@/data/registry";
import { toolVerificationResults } from "./tool-verification.generated";

export type ChecklistDimensionId = "help" | "version" | "json" | "yes" | "dry_run" | "schema";
export type VerificationStatus = "supported" | "not_supported" | "inconclusive" | "error" | "unverified";

export interface ChecklistDimension {
  id: ChecklistDimensionId;
  label: string;
  description: string;
}

export interface VerificationCheck {
  status: VerificationStatus;
  command?: string[];
  evidence?: string;
}

export interface ToolVerificationResult {
  tool_id: string;
  verified_at: string;
  runner_os: string;
  install_method: string;
  install_status: string;
  doctor_passed: boolean;
  checks: Record<ChecklistDimensionId, VerificationCheck>;
}

export interface ToolChecklistStatus {
  tool: Tool;
  verification?: ToolVerificationResult;
  checks: Record<ChecklistDimensionId, VerificationCheck>;
  verified: boolean;
  average: number;
}

export const checklistDimensions: ChecklistDimension[] = [
  {
    id: "help",
    label: "--help",
    description: "The CLI exposes human-readable help output and exits successfully.",
  },
  {
    id: "version",
    label: "--version",
    description: "The CLI exposes a stable version command and exits successfully.",
  },
  {
    id: "json",
    label: "--json",
    description: "The CLI exposes a machine-readable JSON output mode in its command surface.",
  },
  {
    id: "yes",
    label: "--yes",
    description: "The CLI exposes a non-interactive confirmation flag for automation.",
  },
  {
    id: "dry_run",
    label: "--dry-run",
    description: "The CLI exposes a preview mode for mutating operations.",
  },
  {
    id: "schema",
    label: "schema",
    description: "The CLI exposes machine-readable command introspection through a schema command.",
  },
] as const;

const unverifiedCheck: VerificationCheck = {
  status: "unverified",
  evidence: "This checklist item has not been verified in CI yet.",
};

const resultsByToolId = new Map(toolVerificationResults.map((result) => [result.tool_id, result]));

function checklistWeight(status: VerificationStatus) {
  if (status === "supported") return 4;
  if (status === "inconclusive") return 2;
  if (status === "unverified") return 1;
  return 0;
}

function defaultChecks(): Record<ChecklistDimensionId, VerificationCheck> {
  return {
    help: { ...unverifiedCheck },
    version: { ...unverifiedCheck },
    json: { ...unverifiedCheck },
    yes: { ...unverifiedCheck },
    dry_run: { ...unverifiedCheck },
    schema: { ...unverifiedCheck },
  };
}

function normalizedChecks(result?: ToolVerificationResult) {
  return {
    ...defaultChecks(),
    ...(result?.checks ?? {}),
  };
}

function averageChecklistScore(checks: Record<ChecklistDimensionId, VerificationCheck>) {
  const values = Object.values(checks);
  return values.reduce((sum, check) => sum + checklistWeight(check.status), 0) / values.length;
}

export const verifiedChecklistTools: ToolChecklistStatus[] = tools
  .map((tool) => {
    const verification = resultsByToolId.get(tool.id);
    const checks = normalizedChecks(verification);

    return {
      tool,
      verification,
      checks,
      verified: Boolean(verification),
      average: averageChecklistScore(checks),
    };
  })
  .sort((a, b) => {
    const verifiedOrder = Number(b.verified) - Number(a.verified);

    if (verifiedOrder !== 0) {
      return verifiedOrder;
    }

    return b.average - a.average || a.tool.display_name.localeCompare(b.tool.display_name);
  });

export function verificationLabel(status: VerificationStatus) {
  if (status === "supported") return "Verified";
  if (status === "not_supported") return "Not Observed";
  if (status === "inconclusive") return "Inconclusive";
  if (status === "error") return "Error";
  return "Unverified";
}
