module.exports = {
  apps: [
    {
      name: "pumpfun-migrations",
      script: "bun",
      args: "run scripts/pumpfun-migration-listener.ts",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
