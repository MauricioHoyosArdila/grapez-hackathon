import base64
import os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from playwright.async_api import async_playwright

app = FastAPI()


class ScreenshotRequest(BaseModel):
    url: str
    highlight_selector: Optional[str] = None


class AnalyzeRequest(BaseModel):
    url: str
    business_type: Optional[str] = None
    key_conversions: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/screenshot")
async def screenshot(req: ScreenshotRequest):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        try:
            await page.goto(req.url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(req.url, wait_until="domcontentloaded", timeout=30000)

        # Extract interactive elements before screenshot
        elements = await page.evaluate("""() => {
            const els = []
            const selectors = ['button', 'a[href]', 'input[type="submit"]', '[role="button"]']
            for (const sel of selectors) {
                for (const el of document.querySelectorAll(sel)) {
                    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim()
                    if (text && text.length < 80) {
                        const rect = el.getBoundingClientRect()
                        if (rect.width > 0 && rect.height > 0) {
                            els.push({
                                label: text,
                                selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
                                tag: el.tagName.toLowerCase(),
                                href: el.getAttribute('href') || null,
                            })
                        }
                    }
                }
            }
            // deduplicate by label
            const seen = new Set()
            return els.filter(e => {
                if (seen.has(e.label)) return false
                seen.add(e.label)
                return true
            }).slice(0, 30)
        }""")

        # Highlight selector if provided
        if req.highlight_selector:
            try:
                await page.eval_on_selector(
                    req.highlight_selector,
                    "el => el.style.outline = '3px solid #D9FF8B'"
                )
            except Exception:
                pass

        screenshot_bytes = await page.screenshot(full_page=False)
        await browser.close()

    return {
        "screenshot_base64": base64.b64encode(screenshot_bytes).decode(),
        "page_title": await _get_title(req.url),
        "interactive_elements": elements,
    }


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        gtm_ids = []
        ga4_ids = []
        datalayer_events = []

        # Intercept network requests for GTM/GA4 IDs
        async def handle_request(request):
            url = request.url
            if "googletagmanager.com/gtm.js" in url:
                import re
                m = re.search(r'id=(GTM-[A-Z0-9]+)', url)
                if m and m.group(1) not in gtm_ids:
                    gtm_ids.append(m.group(1))
            if "google-analytics.com/g/collect" in url or "analytics.google.com" in url:
                import re
                m = re.search(r'tid=(G-[A-Z0-9]+)', url)
                if m and m.group(1) not in ga4_ids:
                    ga4_ids.append(m.group(1))

        page.on("request", handle_request)

        try:
            await page.goto(req.url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(req.url, wait_until="domcontentloaded", timeout=30000)

        # Read dataLayer
        dl_raw = await page.evaluate("() => window.dataLayer || []")
        datalayer_events = [e for e in dl_raw if isinstance(e, dict)][:20]

        # Check for GTM/GA4 IDs in page source if not found via network
        if not gtm_ids or not ga4_ids:
            content = await page.content()
            import re
            if not gtm_ids:
                gtm_ids = list(set(re.findall(r'GTM-[A-Z0-9]+', content)))
            if not ga4_ids:
                ga4_ids = list(set(re.findall(r'G-[A-Z0-9]+', content)))

        await browser.close()

    return {
        "gtm_container_ids": gtm_ids,
        "ga4_measurement_ids": ga4_ids,
        "datalayer_events": datalayer_events,
        "crawl_method": "playwright_real",
    }


async def _get_title(url: str) -> str:
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(args=["--no-sandbox"])
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            title = await page.title()
            await browser.close()
            return title
    except Exception:
        return url
