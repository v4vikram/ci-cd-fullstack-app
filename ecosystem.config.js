module.exports = {
  apps: [
    {
      name: "ci-cd-backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
