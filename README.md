# Baseline Typescript Node App

## Getting Started

1. `npm install`
2. Update environment variables inside of `.example.env` and change name to `.env`.
3. `npm run start`

### Assumptions

#### Local Development

- You have a local MySQL instance running
- You have a local Redis instance running
- You will create a `.env` based on the `.example.env`
- You will modify the settings in `secret.constants.ts` to suit your needs.

#### Deployment

- There will be a MySQL Server setup that can be connected to via your deployed machine.
- There will be a Redis Instance setup that can be connected to via your deployed machine.
- Secrets will live in AWS and will be retrievable upon deployment.
