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
  // Key application repositories
  {
    owner: "bigknoxy",
    name: "joshbot",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: true
  },
  {
    owner: "bigknoxy",
    name: "joshify",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  },
  {
    owner: "bigknoxy",
    name: "chicken-mob",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  },
  {
    owner: "bigknoxy",
    name: "chop-it-like-its-hawt",
    branch: "main",
    pipelineNotify: true,
    securityScan: false, // Game repo
    e2eTest: true
  },
  {
    owner: "bigknoxy",
    name: "swarm-agent",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  },
  {
    owner: "bigknoxy",
    name: "frame-kit",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  },
  {
    owner: "bigknoxy",
    name: "ghAuto",
    branch: "main",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: false
  }
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