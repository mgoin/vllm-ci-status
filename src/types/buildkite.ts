export interface BuildkiteBuild {
  id: string;
  number: number;
  state: 'running' | 'scheduled' | 'passed' | 'failed' | 'blocked' | 'canceled' | 'canceling' | 'skipped' | 'not_run';
  message: string;
  commit: string;
  branch: string;
  author: {
    name: string;
    email: string;
  };
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  jobs: BuildkiteJob[];
  url: string;
  web_url: string;
}

export interface BuildkiteJob {
  id: string;
  type: 'script' | 'waiter' | 'manual' | 'trigger';
  name: string;
  step_key?: string;
  state: 'waiting' | 'blocked' | 'unblocked' | 'running' | 'passed' | 'failed' | 'canceled' | 'skipped' | 'broken' | 'timing_out' | 'timed_out';
  log_url?: string;
  raw_log_url?: string;
  command?: string;
  exit_status?: number;
  artifact_paths?: string;
  agent?: {
    name: string;
    hostname: string;
  };
  created_at: string;
  scheduled_at?: string;
  runnable_at?: string;
  started_at?: string;
  finished_at?: string;
  retried?: boolean;
  retried_in_job_id?: string;
  retry_type?: string;
  soft_failed?: boolean;
  unblocked_by?: {
    name: string;
    email: string;
  };
  unblocked_at?: string;
  web_url: string;
}

export interface JobHealthStatus {
  stepKey: string;
  name: string;
  lastRun?: string;
  lastState: BuildkiteJob['state'];
  frequency: number;
  isOptional: boolean;
  builds: Array<{
    buildNumber: number;
    commit: string;
    state: BuildkiteJob['state'];
    startedAt?: string;
    finishedAt?: string;
    buildUrl: string;
  }>;
}

export interface DashboardData {
  lastUpdated: string;
  jobs: JobHealthStatus[];
  totalBuilds: number;
}