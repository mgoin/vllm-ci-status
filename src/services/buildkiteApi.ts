import axios, { AxiosResponse } from 'axios';
import { BuildkiteBuild } from '../types/buildkite';

const BUILDKITE_API_BASE = 'https://api.buildkite.com/v2';

interface BuildkiteApiConfig {
  token?: string;
  orgSlug?: string;
  pipelineSlug?: string;
}

class BuildkiteApiClient {
  private axios;
  private orgSlug: string;
  private pipelineSlug: string;

  constructor(config: BuildkiteApiConfig = {}) {
    this.orgSlug = config.orgSlug || 'vllm';
    this.pipelineSlug = config.pipelineSlug || 'ci';
    this.axios = axios.create({
      baseURL: BUILDKITE_API_BASE,
      headers: {
        'Authorization': config.token ? `Bearer ${config.token}` : undefined,
        'Content-Type': 'application/json',
      },
    });
  }

  async getBuilds(
    branch: string = 'main',
    limit: number = 50,
    page: number = 1
  ): Promise<BuildkiteBuild[]> {
    try {
      const response: AxiosResponse<BuildkiteBuild[]> = await this.axios.get(
        `/organizations/${this.orgSlug}/pipelines/${this.pipelineSlug}/builds`,
        {
          params: {
            branch,
            per_page: limit,
            page,
            include_retried_jobs: false, // Reduce duplicates
            state: ['running', 'passed', 'failed', 'blocked', 'canceled'], // Skip scheduled
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching builds:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API token or insufficient permissions');
        } else if (error.response?.status === 404) {
          throw new Error('Pipeline not found. Check organization and pipeline names.');
        } else if (error.response?.status === 403) {
          throw new Error('Access denied. Check API token permissions.');
        }
      }
      throw new Error('Failed to fetch builds. Check your network connection.');
    }
  }

  async getBuild(buildNumber: number): Promise<BuildkiteBuild> {
    try {
      const response: AxiosResponse<BuildkiteBuild> = await this.axios.get(
        `/organizations/${this.orgSlug}/pipelines/${this.pipelineSlug}/builds/${buildNumber}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching build ${buildNumber}:`, error);
      throw error;
    }
  }

  async getRecentBuilds(
    branch: string = 'main', 
    buildLimit: number = 100,
    targetCommits: number = 30
  ): Promise<BuildkiteBuild[]> {
    try {
      console.log(`Fetching builds to get ~${targetCommits} unique commits (max ${buildLimit} builds)...`);
      
      const allBuilds: BuildkiteBuild[] = [];
      const seenCommits = new Set<string>();
      let page = 1;
      let hasMore = true;
      const perPage = 50; // Smaller pages for efficiency
      
      while (hasMore && allBuilds.length < buildLimit && seenCommits.size < targetCommits) {
        console.log(`Fetching page ${page} (have ${seenCommits.size} unique commits)...`);
        const pageBuilds = await this.getBuilds(branch, perPage, page);
        
        if (pageBuilds.length === 0) {
          hasMore = false;
          break;
        }
        
        // Filter builds that have actual jobs and track unique commits
        const buildsWithJobs = pageBuilds.filter(build => {
          const hasJobs = build.jobs.some(job => job.type === 'script');
          if (hasJobs) {
            seenCommits.add(build.commit);
          }
          return hasJobs;
        });
        
        allBuilds.push(...buildsWithJobs);
        
        // Stop early if we have enough unique commits
        if (seenCommits.size >= targetCommits) {
          console.log(`Found ${targetCommits} unique commits, stopping early`);
          hasMore = false;
        }
        
        // Stop if we got fewer builds than requested (end of data)
        if (pageBuilds.length < perPage) {
          hasMore = false;
        }
        
        page++;
      }
      
      const finalBuilds = allBuilds
        .slice(0, buildLimit) // Ensure we don't exceed the limit
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`Loaded ${finalBuilds.length} builds with ${seenCommits.size} unique commits from ${page - 1} pages`);
      return finalBuilds;
      
    } catch (error) {
      console.error('Error in getRecentBuilds:', error);
      throw error;
    }
  }
}

export default BuildkiteApiClient;