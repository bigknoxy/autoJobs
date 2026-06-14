/**
 * Repository configuration for automated monitoring
 * Target repositories: https://github.com/bigknoxy organization (2024-present)
 */
export interface RepoConfig {
  owner: string;
  name: string;
  // Auto-clone if not exists
  autoClone?: boolean;
  // Branch to monitor
  branch?: string;
  // Notify on pipeline status changes
  pipelineNotify?: boolean;
  // Run security scans
  securityScan?: boolean;
  // Run E2E tests on PRs
  e2eTest?: boolean;
  // Custom webhook for notifications
  webhookUrl?: string;
}

export const REPOSITORIES: RepoConfig[] = [
  { owner: "bigknoxy", name: "autoJobs", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "arrowhead-junkie", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "hermes-backup", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "HashPilot", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "exa-cli", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "joshbot", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "chop-it-like-its-hawt", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "bigknoxy.github.io", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "chicken-mob", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "ghAuto", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "joshify", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "agentic-sdlc-framework", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "self-evolving-dev-ecosystem", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "team-ai-warehouse", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "TurboHop", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "flight-deal-monitor", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "SmashMine", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "swarm-agent", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "frame-kit", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "auto-portfolio", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "pi-mono-jk", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "claude-statusbar", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "paperclip-pages", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "knowledge-base-dashboard", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "auto-portfolio-pages", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "digital-spring-clean", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "workflow-jk", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "toilet-runner", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "tiny-fixers", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "opencode-skill-evolution", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "unified-jk", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "pew-run-game", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "forge", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "chopIt", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "ideavault", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "jeetSocial2", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "sqlOptimizer", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "ktracker", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "CarePathAI", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "jeetSocial", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "pHelper", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "joshNews", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "ai-rag", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "bigknoxy-new", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "text-moderation-api", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "bigknoxy-site", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "HelprLocal", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "autogen-play", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "runThisThing", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true },
  { owner: "bigknoxy", name: "GoNews", autoClone: true, branch: "main", pipelineNotify: true, securityScan: true, e2eTest: true }
];

export const MONITOR_CONFIG = {
  // Check interval in minutes
  interval: 5,
  // Working directory for clones
  workDir: "/root/code/autoJobs/worktrees",
  // Pi coding assistant config
  pi: {
    model: "poolside/laguna-m.1",
    provider: "poolside",
    // Thinking level for complex tasks
    thinking: "high"
  }
};