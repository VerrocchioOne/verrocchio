module.exports = {
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "ios",
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      }
    }
  ],
  webServer: {
    command: "powershell -ExecutionPolicy Bypass -File ./serve.ps1",
    port: 8080,
    reuseExistingServer: true,
    timeout: 10000
  }
};
