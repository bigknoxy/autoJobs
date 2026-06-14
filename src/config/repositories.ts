/**
 * Repository configuration for automated monitoring
 * Target repositories: https://github.com/bigknoxy organization
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
  // Dogfooding - monitoring this repo itself
  {
    owner: "bigknoxy",
    name: "autoJobs",
    autoClone: true,
    branch: "master",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  },
  // Add more bigknoxy repositories here
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