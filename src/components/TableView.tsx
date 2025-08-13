import React, { useState, useMemo } from 'react';
import { DashboardData, JobHealthStatus } from '../types/buildkite';
import { getJobStateColor, getJobStateIcon, getRelativeTime } from '../utils/dataProcessor';

interface TableViewProps {
  data: DashboardData;
}

interface CommitData {
  commit: string;
  buildNumber: number;
  buildUrl: string;
  timestamp: string;
  jobs: Map<string, { state: string; buildUrl: string }>;
}

export const TableView: React.FC<TableViewProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="table-view">
        <div className="loading">Loading table data...</div>
      </div>
    );
  }
  const [jobFilter, setJobFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'frequency' | 'status'>('frequency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [maxCommits, setMaxCommits] = useState<number>(20);

  const { commits, filteredJobs } = useMemo(() => {
    // Get all unique commits across all jobs
    const commitMap = new Map<string, CommitData>();
    
    data.jobs.forEach(job => {
      job.builds.forEach(build => {
        if (!commitMap.has(build.commit)) {
          commitMap.set(build.commit, {
            commit: build.commit,
            buildNumber: build.buildNumber,
            buildUrl: build.buildUrl,
            timestamp: build.startedAt || '',
            jobs: new Map()
          });
        }
        
        const commitData = commitMap.get(build.commit)!;
        commitData.jobs.set(job.name, {
          state: build.state,
          buildUrl: build.buildUrl
        });
      });
    });

    // Sort commits by build number (most recent first)
    const sortedCommits = Array.from(commitMap.values())
      .sort((a, b) => b.buildNumber - a.buildNumber)
      .slice(0, maxCommits);

    // Filter and sort jobs
    let filtered = data.jobs.filter(job => 
      job.name.toLowerCase().includes(jobFilter.toLowerCase()) ||
      job.stepKey.toLowerCase().includes(jobFilter.toLowerCase())
    );

    filtered = filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'frequency':
          aVal = a.frequency;
          bVal = b.frequency;
          break;
        case 'status':
          const statusOrder = ['failed', 'running', 'waiting', 'blocked', 'passed', 'skipped', 'canceled'];
          aVal = statusOrder.indexOf(a.lastState);
          bVal = statusOrder.indexOf(b.lastState);
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });

    return { commits: sortedCommits, filteredJobs: filtered };
  }, [data, jobFilter, sortBy, sortOrder, maxCommits]);

  const getJobStateForCommit = (job: JobHealthStatus, commit: CommitData) => {
    return commit.jobs.get(job.name);
  };

  return (
    <div className="table-view">
      <div className="table-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Filter Jobs:</label>
            <input
              type="text"
              placeholder="Filter by job name or step key..."
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="control-group">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="name">Job Name</option>
              <option value="frequency">Frequency</option>
              <option value="status">Status</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="sort-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Max Commits:</label>
            <select
              value={maxCommits}
              onChange={(e) => setMaxCommits(Number(e.target.value))}
              className="sort-select"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        
        <div className="table-footer">
          <div className="stats">
            Showing {filteredJobs.length} jobs across {commits.length} commits
          </div>
          
          <div className="legend">
            <div className="legend-title">Status Legend:</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#10B981' }}>✅</span>
                <span>Passed</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#EF4444' }}>❌</span>
                <span>Failed</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#3B82F6' }}>🔄</span>
                <span>Running</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#F59E0B' }}>⏳</span>
                <span>Waiting</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#9CA3AF' }}>⏸️</span>
                <span>Blocked</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#6B7280' }}>⭕</span>
                <span>Canceled</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon" style={{ backgroundColor: '#6B7280' }}>⏭️</span>
                <span>Skipped</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon empty">-</span>
                <span>Not Run</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="jobs-table">
          <thead>
            <tr>
              <th className="job-header">Job Name</th>
              <th className="freq-header">Freq</th>
              {commits.map(commit => (
                <th key={commit.commit} className="commit-header">
                  <div className="commit-info">
                    <a href={commit.buildUrl} target="_blank" rel="noopener noreferrer" className="commit-link">
                      #{commit.buildNumber}
                    </a>
                    <div className="commit-hash">{commit.commit}</div>
                    {commit.timestamp && (
                      <div className="commit-time">{getRelativeTime(commit.timestamp)}</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => (
              <tr key={job.stepKey + job.name}>
                <td className="job-cell">
                  <div className="job-info">
                    <span className="job-icon">{getJobStateIcon(job.lastState)}</span>
                    <div>
                      <div className="job-name">{job.name}</div>
                      <div className="job-step-key">{job.stepKey}</div>
                    </div>
                  </div>
                </td>
                <td className="freq-cell">{job.frequency}</td>
                {commits.map(commit => {
                  const jobState = getJobStateForCommit(job, commit);
                  return (
                    <td key={commit.commit} className="commit-cell">
                      {jobState ? (
                        <a
                          href={jobState.buildUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="state-cell"
                          style={{ backgroundColor: getJobStateColor(jobState.state as any) }}
                          title={`${job.name}: ${jobState.state}`}
                        >
                          {getJobStateIcon(jobState.state as any)}
                        </a>
                      ) : (
                        <div className="state-cell empty" title="Job did not run">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};