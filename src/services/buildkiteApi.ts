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
            include_retried_jobs: true,
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
    buildLimit: number = 100
  ): Promise<BuildkiteBuild[]> {
    try {
      console.log(`Fetching up to ${buildLimit} recent builds...`);
      
      const allBuilds: BuildkiteBuild[] = [];
      let page = 1;
      let hasMore = true;
      const perPage = Math.min(100, buildLimit); // API max is 100 per page
      
      while (hasMore && allBuilds.length < buildLimit) {
        const remaining = buildLimit - allBuilds.length;
        const pageSize = Math.min(perPage, remaining);
        
        console.log(`Fetching page ${page} (${pageSize} builds)...`);
        const pageBuilds = await this.getBuilds(branch, pageSize, page);
        
        if (pageBuilds.length === 0) {
          hasMore = false;
          break;
        }
        
        allBuilds.push(...pageBuilds);
        
        // Stop if we got fewer builds than requested (end of data)
        if (pageBuilds.length < pageSize) {
          hasMore = false;
        }
        
        page++;
      }
      
      const finalBuilds = allBuilds
        .slice(0, buildLimit) // Ensure we don't exceed the limit
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`Loaded ${finalBuilds.length} builds from ${page - 1} pages`);
      return finalBuilds;
      
    } catch (error) {
      console.error('Error in getRecentBuilds:', error);
      throw error;
    }
  }
}

export default BuildkiteApiClient;