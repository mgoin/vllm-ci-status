import React, { useState } from 'react';

export interface DashboardConfig {
  orgSlug: string;
  pipelineSlug: string;
  branch: string;
  apiToken: string;
  buildLimit: number;
}

interface SettingsProps {
  config: DashboardConfig;
  onConfigChange: (config: DashboardConfig) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onConfigChange, onClose }) => {
  const [formData, setFormData] = useState<DashboardConfig>(config);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigChange(formData);
    onClose();
  };

  const handleChange = (field: keyof DashboardConfig, value: string) => {
    const parsedValue = field === 'buildLimit' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [field]: parsedValue }));
  };

  const loadDefaults = () => {
    setFormData({
      orgSlug: 'vllm',
      pipelineSlug: 'ci',
      branch: 'main',
      apiToken: formData.apiToken, // Keep existing token
      buildLimit: 50
    });
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Dashboard Configuration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="orgSlug">Organization Slug</label>
              <input
                id="orgSlug"
                type="text"
                value={formData.orgSlug}
                onChange={(e) => handleChange('orgSlug', e.target.value)}
                placeholder="e.g., vllm, mycompany"
                required
              />
              <small>The organization name from your Buildkite URL</small>
            </div>

            <div className="form-group">
              <label htmlFor="pipelineSlug">Pipeline Slug</label>
              <input
                id="pipelineSlug"
                type="text"
                value={formData.pipelineSlug}
                onChange={(e) => handleChange('pipelineSlug', e.target.value)}
                placeholder="e.g., ci, deploy, test"
                required
              />
              <small>The pipeline name from your Buildkite URL</small>
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input
                id="branch"
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="e.g., main, master, develop"
                required
              />
              <small>The git branch to monitor</small>
            </div>

            <div className="form-group">
              <label htmlFor="buildLimit">Build Limit</label>
              <select
                id="buildLimit"
                value={formData.buildLimit}
                onChange={(e) => handleChange('buildLimit', e.target.value)}
              >
                <option value="30">30 builds</option>
                <option value="50">50 builds</option>
                <option value="75">75 builds</option>
                <option value="100">100 builds</option>
              </select>
              <small>Maximum number of recent builds to fetch</small>
            </div>

            <div className="form-group">
              <label htmlFor="apiToken">
                Buildkite API Token
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? '🙈' : '👁️'}
                </button>
              </label>
              <input
                id="apiToken"
                type={showToken ? 'text' : 'password'}
                value={formData.apiToken}
                onChange={(e) => handleChange('apiToken', e.target.value)}
                placeholder="bkua_xxxxxxxxxxxxxxxxxxxx"
              />
              <small>
                Get your token from{' '}
                <a href="https://buildkite.com/user/api-access-tokens" target="_blank" rel="noopener noreferrer">
                  Buildkite API Access Tokens
                </a>
                {' '}(requires read_builds scope)
              </small>
            </div>

            <div className="form-actions">
              <button type="button" className="load-defaults-btn" onClick={loadDefaults}>
                Load vLLM Defaults
              </button>
              <div className="action-buttons">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save & Reload
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};