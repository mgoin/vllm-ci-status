import { BuildkiteBuild, BuildkiteJob, JobHealthStatus, DashboardData } from '../types/buildkite';

export function isOptionalJob(job: BuildkiteJob): boolean {
  if (job.soft_failed === true) {
    return true;
  }
  
  const name = job.name.toLowerCase();
  const stepKey = (job.step_key || '').toLowerCase();
  
  const optionalPatterns = [
    /optional/,
    /allow.?fail/,
    /non.?blocking/,
    /\(optional\)/,
    /\[optional\]/,
    /experimental/,
    /beta/,
    /benchmark/,
    /perf/
  ];
  
  return optionalPatterns.some(pattern => 
    pattern.test(name) || pattern.test(stepKey)
  );
}

export function processBuildsData(builds: BuildkiteBuild[]): DashboardData {
  const jobMap = new Map<string, JobHealthStatus>();
  
  console.log(`Processing ${builds.length} builds`);
  
  builds.forEach(build => {
    build.jobs.forEach(job => {
      if (job.type === 'script') {
        const key = job.step_key || job.name || job.id;
        
        if (!jobMap.has(key)) {
          jobMap.set(key, {
            stepKey: job.step_key || 'no-key',
            name: job.name,
            lastState: job.state,
            frequency: 0,
            isOptional: isOptionalJob(job),
            builds: []
          });
        }
        
        const jobStatus = jobMap.get(key)!;
        jobStatus.frequency++;
        
        if (!jobStatus.lastRun || new Date(job.created_at) > new Date(jobStatus.lastRun)) {
          jobStatus.lastRun = job.created_at;
          jobStatus.lastState = job.state;
        }
        
        // Update optional status if any instance of this job is optional
        if (!jobStatus.isOptional && isOptionalJob(job)) {
          jobStatus.isOptional = true;
        }
        
        jobStatus.builds.push({
          buildNumber: build.number,
          commit: build.commit.substring(0, 7),
          state: job.state,
          startedAt: job.started_at,
          finishedAt: job.finished_at,
          buildUrl: build.web_url
        });
      }
    });
  });
  
  const jobs = Array.from(jobMap.values())
    .map(job => ({
      ...job,
      builds: job.builds
        .sort((a, b) => b.buildNumber - a.buildNumber)
        .slice(0, 50) // Keep more builds per job for better commit coverage
    }))
    .sort((a, b) => {
      const priorityOrder = ['failed', 'running', 'passed', 'skipped', 'canceled'];
      const aPriority = priorityOrder.indexOf(a.lastState);
      const bPriority = priorityOrder.indexOf(b.lastState);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return b.frequency - a.frequency;
    });

  return {
    lastUpdated: new Date().toISOString(),
    jobs,
    totalBuilds: builds.length
  };
}

export function getJobStateColor(state: BuildkiteJob['state']): string {
  switch (state) {
    case 'passed':
      return '#10B981';
    case 'failed':
    case 'broken':
    case 'timed_out':
      return '#EF4444';
    case 'running':
      return '#3B82F6';
    case 'waiting':
    case 'unblocked':
      return '#F59E0B';
    case 'blocked':
      return '#9CA3AF';
    case 'canceled':
    case 'skipped':
      return '#6B7280';
    default:
      return '#9CA3AF';
  }
}

export function getJobStateIcon(state: BuildkiteJob['state']): string {
  switch (state) {
    case 'passed':
      return '✅';
    case 'failed':
    case 'broken':
    case 'timed_out':
      return '❌';
    case 'running':
      return '🔄';
    case 'waiting':
    case 'unblocked':
      return '⏳';
    case 'blocked':
      return '⏸️';
    case 'canceled':
      return '⭕';
    case 'skipped':
      return '⏭️';
    default:
      return '❓';
  }
}

export function formatDuration(startedAt?: string, finishedAt?: string): string {
  if (!startedAt) return 'Not started';
  if (!finishedAt) return 'Running...';
  
  const start = new Date(startedAt);
  const end = new Date(finishedAt);
  const durationMs = end.getTime() - start.getTime();
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}