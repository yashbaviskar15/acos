# Frontend

This React 18 + TypeScript + Tailwind app is the CloudOS command center. It authenticates against `ArvGate`, stores access and refresh tokens in browser storage for local dev, and renders a placeholder operations overview backed by the stubbed platform APIs.

For local development, Vite proxies `/api` traffic to the Nginx gateway so the UI exercises the same route surface that Docker and Kubernetes use.
