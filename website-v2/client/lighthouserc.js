module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],

        // Performance Categories
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Resource Optimization
        'uses-text-compression': ['error', { minScore: 1 }],
        'uses-responsive-images': ['error', { minScore: 1 }],
        'uses-rel-preconnect': ['error', { minScore: 1 }],
        'uses-rel-preload': ['error', { minScore: 1 }],
        'unused-javascript': ['error', { maxNumericValue: 0.1 }],
        'unused-css-rules': ['error', { maxNumericValue: 0.1 }],
        'render-blocking-resources': ['error', { maxNumericValue: 0.1 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 2000000 }],

        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        'tap-targets': ['error', { minScore: 1 }],

        // Best Practices
        'uses-http2': ['error', { minScore: 1 }],
        'uses-passive-event-listeners': ['error', { minScore: 1 }],
        'no-document-write': ['error', { minScore: 1 }],
        'no-unused-labels': ['error', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],

        // SEO
        'robots-txt': ['error', { minScore: 1 }],
        'canonical': ['error', { minScore: 1 }],
        'font-size': ['error', { minScore: 1 }],
        'plugins': ['error', { minScore: 1 }],
        'structured-data': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}; 