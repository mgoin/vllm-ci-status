import React from 'react';
import { JobHealthStatus } from '../types/buildkite';
import { getJobStateColor, getJobStateIcon, getRelativeTime, formatDuration } from '../utils/dataProcessor';

interface JobCardProps {
  job: JobHealthStatus;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const stateColor = getJobStateColor(job.lastState);
  const stateIcon = getJobStateIcon(job.lastState);
  
  return (
    <div className="job-card">
      <div className="job-header">
        <div className="job-title">
          <span className="job-icon">{stateIcon}</span>
          <h3>{job.name}</h3>
        </div>
        <div className="job-meta">
          <span className="frequency">Ran {job.frequency} times</span>
          {job.lastRun && (
            <span className="last-run">Last: {getRelativeTime(job.lastRun)}</span>
          )}
        </div>
      </div>
      
      <div className="job-timeline">
        {job.builds.slice(0, 10).map((build, index) => (
          <div
            key={`${build.buildNumber}-${index}`}
            className="timeline-item"
            style={{ backgroundColor: getJobStateColor(build.state) }}
            title={`Build #${build.buildNumber} (${build.commit}): ${build.state}${
              build.startedAt && build.finishedAt 
                ? ` - ${formatDuration(build.startedAt, build.finishedAt)}`
                : ''
            }`}
            onClick={() => window.open(build.buildUrl, '_blank')}
          />
        ))}
      </div>
      
      <div className="job-stats">
        <div className="stat">
          <span className="stat-label">Latest State:</span>
          <span className="stat-value" style={{ color: stateColor }}>
            {job.lastState}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Step Key:</span>
          <span className="stat-value">{job.stepKey}</span>
        </div>
      </div>
    </div>
  );
};