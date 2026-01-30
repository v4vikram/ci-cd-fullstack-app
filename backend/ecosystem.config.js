module.exports = {
  apps: [
    {
      name: "ci-cd-fullstack",
      script: "server.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
