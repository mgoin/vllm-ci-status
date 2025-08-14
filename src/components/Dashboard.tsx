import React, { useState, useEffect } from 'react';
import { JobCard } from './JobCard';
import { TableView } from './TableView';
import { Settings, DashboardConfig } from './Settings';
import { DashboardData } from '../types/buildkite';
import BuildkiteApiClient from '../services/buildkiteApi';
import { processBuildsData, getRelativeTime } from '../utils/dataProcessor';

const DEFAULT_CONFIG: DashboardConfig = {
  orgSlug: 'vllm',
  pipelineSlug: 'ci',
  branch: 'main',
  apiToken: '',
  buildLimit: 50
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('table');
  const [filter, setFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [hideOptionalJobs, setHideOptionalJobs] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>(() => {
    const saved = localStorage.getItem('buildkite-dashboard-config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    return DEFAULT_CONFIG;
  });
  const [apiClient, setApiClient] = useState<BuildkiteApiClient>(() => 
    new BuildkiteApiClient({ 
      token: config.apiToken,
      orgSlug: config.orgSlug,
      pipelineSlug: config.pipelineSlug
    })
  );

  const handleConfigChange = (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    localStorage.setItem('buildkite-dashboard-config', JSON.stringify(newConfig));
    
    // Create new API client with updated config
    const newApiClient = new BuildkiteApiClient({
      token: newConfig.apiToken,
      orgSlug: newConfig.orgSlug,
      pipelineSlug: newConfig.pipelineSlug
    });
    setApiClient(newApiClient);
    
    // Reset data and reload
    setData(null);
    setError(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(`Loading ${config.buildLimit} builds...`);
      
      console.log('Fetching builds from Buildkite API...');
      
      const builds = await apiClient.getRecentBuilds(config.branch, config.buildLimit, 30);
      console.log(`Fetched ${builds.length} builds`);
      
      const processed = processBuildsData(builds);
      console.log(`Processed ${processed.jobs.length} jobs`);
      
      setData(processed);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  useEffect(() => {
    if (config.apiToken && config.orgSlug && config.pipelineSlug) {
      fetchData();
    }
  }, [apiClient, config.branch]);

  // Auto-reload when config changes
  useEffect(() => {
    if (config.apiToken && config.orgSlug && config.pipelineSlug) {
      fetchData();
    } else {
      setLoading(false);
      setLoadingProgress('');
      setData(null);
      setError(null);
    }
  }, [apiClient]);

  const filteredJobs = data?.jobs.filter(job => {
    const matchesName = job.name.toLowerCase().includes(filter.toLowerCase()) ||
                       job.stepKey.toLowerCase().includes(filter.toLowerCase());
    const matchesState = stateFilter === 'all' || job.lastState === stateFilter;
    const matchesOptionalFilter = !hideOptionalJobs || !job.isOptional;
    return matchesName && matchesState && matchesOptionalFilter;
  }) || [];

  if (loading && !data) {
    return <div className="loading">Loading CI dashboard...</div>;
  }

  if (!config.apiToken && !data) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Buildkite CI Dashboard</h1>
          <div className="dashboard-meta">
            <button onClick={() => setShowSettings(true)} className="settings-btn">
              ⚙️ Settings
            </button>
          </div>
        </header>
        
        <div className="welcome-screen">
          <div className="welcome-content">
            <h2>Welcome to Buildkite CI Dashboard</h2>
            <p>Monitor your CI job health across commits with an intuitive dashboard.</p>
            
            <div className="welcome-features">
              <div className="feature">
                <span className="feature-icon">📊</span>
                <div>
                  <h3>Visual Timeline</h3>
                  <p>See job execution patterns across recent commits</p>
                </div>
              </div>
              
              <div className="feature">
                <span className="feature-icon">📋</span>
                <div>
                  <h3>Table View</h3>
                  <p>Jobs vs commits matrix for detailed analysis</p>
                </div>
              </div>
              
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <div>
                  <h3>Smart Filtering</h3>
                  <p>Filter and sort jobs by status, frequency, or name</p>
                </div>
              </div>
            </div>
            
            <div className="welcome-setup">
              <h3>Get Started</h3>
              <ol>
                <li>Click the <strong>⚙️ Settings</strong> button above</li>
                <li>Enter your Buildkite organization and pipeline details</li>
                <li>Add your API token for full access</li>
                <li>Start monitoring your CI health!</li>
              </ol>
              
              <button onClick={() => setShowSettings(true)} className="get-started-btn">
                Get Started
              </button>
            </div>
          </div>
        </div>

        {showSettings && (
          <Settings
            config={config}
            onConfigChange={handleConfigChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error">
        <h2>Error loading dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
        <button onClick={() => setShowSettings(true)} className="settings-btn" style={{ marginLeft: '1rem' }}>
          ⚙️ Settings
        </button>
      </div>
    );
  }

  const stateOptions = [
    { value: 'all', label: 'All States' },
    { value: 'failed', label: 'Failed' },
    { value: 'passed', label: 'Passed' },
    { value: 'running', label: 'Running' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'skipped', label: 'Skipped' }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Buildkite CI Dashboard</h1>
        <div className="dashboard-meta">
          <span>{config.orgSlug}/{config.pipelineSlug} • {config.branch} Branch • {data?.totalBuilds || 0} recent builds</span>
          {loadingProgress && (
            <span className="loading-progress">
              <span className="loading-spinner">⏳</span>
              {loadingProgress}
            </span>
          )}
          {!loading && data?.lastUpdated && (
            <span>Updated {getRelativeTime(data.lastUpdated)}</span>
          )}
          <button onClick={() => setShowSettings(true)} className="settings-btn">
            ⚙️ Settings
          </button>
          <button onClick={fetchData} disabled={loading} className="refresh-btn">
            {loading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          📊 Card View
        </button>
        <button
          className={`tab ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          📋 Table View
        </button>
      </div>

      <div className="dashboard-controls">
        <div className="control-group">
          <input
            type="text"
            placeholder="Filter jobs by name or step key..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="control-group">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="state-filter"
          >
            {stateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hideOptionalJobs}
              onChange={(e) => setHideOptionalJobs(e.target.checked)}
              className="optional-filter-checkbox"
            />
            Hide optional jobs
          </label>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {activeTab === 'cards' ? (
        <div className="jobs-grid">
          {filteredJobs.length === 0 ? (
            <div className="no-results">
              {filter || stateFilter !== 'all' || hideOptionalJobs
                ? 'No jobs match your filters' 
                : 'No jobs found'
              }
            </div>
          ) : (
            filteredJobs.map(job => (
              <JobCard key={job.stepKey + job.name} job={job} />
            ))
          )}
        </div>
      ) : (
        <TableView data={{ ...data!, jobs: filteredJobs }} />
      )}

      {error && !loading && (
        <div className="error-banner" style={{ marginTop: '1rem' }}>
          <span>⚠️ {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {showSettings && (
        <Settings
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};