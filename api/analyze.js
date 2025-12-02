import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';

export const config = {
  maxDuration: 300, // 5 minutes
  memory: 2048 // 2GB
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, deviceType = 'desktop' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!['mobile', 'desktop'].includes(deviceType)) {
    return res.status(400).json({ error: 'deviceType must be "mobile" or "desktop"' });
  }

  let browser;
  try {
    console.log(`Starting ${deviceType} analysis for: ${url}`);
    
    // Launch Chromium with Puppeteer
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    // Get the WebSocket endpoint for Lighthouse
    const browserWSEndpoint = browser.wsEndpoint();
    const url_obj = new URL(browserWSEndpoint);
    const port = url_obj.port;
    
    // Build Lighthouse options with inline settings to avoid config imports
    const options = {
      logLevel: 'info',
      output: 'json',
      port: parseInt(port),
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      disableFullPageScreenshot: false,
      // Desktop-specific settings
      formFactor: deviceType === 'desktop' ? 'desktop' : 'mobile',
      throttling: deviceType === 'desktop' ? {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      } : undefined,
      screenEmulation: deviceType === 'desktop' ? {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      } : undefined,
    };
    
    const runnerResult = await lighthouse(url, options);
    const report = JSON.parse(runnerResult.report);

    const scores = {
      performance: report.categories.performance ? report.categories.performance.score * 100 : 0,
      accessibility: report.categories.accessibility ? report.categories.accessibility.score * 100 : 0,
      bestPractices: report.categories['best-practices'] ? report.categories['best-practices'].score * 100 : 0,
      seo: report.categories.seo ? report.categories.seo.score * 100 : 0,
    };

    // Extract audit details
    const extractAudits = (categoryId) => {
      if (!report.categories[categoryId] || !report.categories[categoryId].auditRefs) {
        return [];
      }
      
      const refs = report.categories[categoryId].auditRefs;
      const results = refs.map(ref => {
          const audit = report.audits[ref.id];
          if (!audit) return null;
          
          if (audit.score === 1) return null;
          if (audit.score === null && ['notApplicable', 'informative'].includes(audit.scoreDisplayMode)) {
            return null;
          }
          
          return {
            id: ref.id,
            title: audit.title,
            description: audit.description,
            score: audit.score !== null ? audit.score * 100 : null,
            scoreDisplayMode: audit.scoreDisplayMode,
            displayValue: audit.displayValue,
            details: audit.details,
            warnings: audit.warnings,
          };
        })
        .filter(audit => audit !== null)
        .sort((a, b) => {
          if (a.score !== null && b.score !== null) return a.score - b.score;
          if (a.score === null) return 1;
          if (b.score === null) return -1;
          return a.title.localeCompare(b.title);
        });
      
      return results;
    };

    const audits = {
      performance: extractAudits('performance'),
      accessibility: extractAudits('accessibility'),
      bestPractices: extractAudits('best-practices'),
      seo: extractAudits('seo'),
    };

    // Extract screenshot
    let thumbnail = null;
    try {
      if (report.audits && report.audits['final-screenshot']) {
        const finalScreenshot = report.audits['final-screenshot'];
        if (finalScreenshot.details && finalScreenshot.details.type === 'screenshot') {
          const screenshotData = finalScreenshot.details.data;
          if (screenshotData) {
            thumbnail = screenshotData.startsWith('data:') ? screenshotData : `data:image/jpeg;base64,${screenshotData}`;
          }
        }
      }
      
      if (!thumbnail && report.fullPageScreenshot && report.fullPageScreenshot.screenshot) {
        const screenshotData = report.fullPageScreenshot.screenshot.data;
        if (screenshotData) {
          thumbnail = screenshotData.startsWith('data:') ? screenshotData : `data:image/png;base64,${screenshotData}`;
        }
      }
    } catch (screenshotError) {
      console.warn('Could not extract screenshot:', screenshotError.message);
    }

    console.log(`${deviceType} analysis complete`, scores);
    
    return res.status(200).json({ 
      url, 
      deviceType,
      timestamp: new Date().toISOString(),
      scores,
      thumbnail,
      audits 
    });

  } catch (error) {
    console.error('Lighthouse error:', error);
    return res.status(500).json({ 
      error: 'Failed to run Lighthouse', 
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
