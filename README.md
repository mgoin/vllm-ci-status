# vLLM CI Status Dashboard

A clean, responsive dashboard for monitoring Buildkite CI job health across commits. See which jobs run for each commit and track patterns over time.

## Features

- **Jobs vs Commits Matrix** - See exactly which jobs ran for each commit
- **Status Timeline** - Visual health indicators with color coding
- **Smart Filtering** - Filter jobs by name, status, or frequency
- **Configurable** - Works with any Buildkite organization and pipeline
- **No Setup Required** - Pure client-side app, configure through UI

## Quick Start

1. **Visit the dashboard**: [https://mgoin.github.io/vllm-ci-status/](https://mgoin.github.io/vllm-ci-status/)
2. **Click ⚙️ Settings** to configure your Buildkite details
3. **Enter your**:
   - Organization slug (e.g., `vllm`)
   - Pipeline slug (e.g., `ci`) 
   - Branch name (e.g., `main`)
   - API token (get from [Buildkite API Access Tokens](https://buildkite.com/user/api-access-tokens))
4. **Start monitoring** your CI health!

## Status Legend

- 🟢 **Passed** - Job completed successfully
- 🔴 **Failed** - Job failed or timed out  
- 🔵 **Running** - Job is currently executing
- 🟡 **Waiting** - Job is waiting or blocked
- ⚫ **Canceled** - Job was canceled or skipped
- **-** **Not Run** - Job didn't execute for this commit

## Deploy Your Own

Fork this repo and deploy to GitHub Pages:

1. Fork this repository
2. Go to Settings → Pages → Source: "GitHub Actions"  
3. Push to main branch - auto-deploys via GitHub Actions
4. Access at `https://yourusername.github.io/vllm-ci-status/`

Also works with Vercel, Netlify, or any static hosting.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000/vllm-ci-status/