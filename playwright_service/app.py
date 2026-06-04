import os
import re
import uuid
import tempfile
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright, Page

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCREENSHOTS_DIR = Path(tempfile.gettempdir()) / "grapez_screenshots"
SCREENSHOTS_DIR.mkdir(exist_ok=True)

SERVICE_URL = os.environ.get("PLAYWRIGHT_SERVICE_URL", "http://localhost:8080")


class ScreenshotRequest(BaseModel):
    url: str
    highlight_selector: Optional[str] = None


class AnalyzeRequest(BaseModel):
    url: str
    business_type: Optional[str] = None
    key_conversions: Optional[str] = None


class CrawlRequest(BaseModel):
    url: str
    max_pages: Optional[int] = 6


CONVERSION_URL_KEYWORDS = [
    "contact", "contacto", "demo", "trial", "prueba", "register", "registro",
    "signup", "sign-up", "checkout", "compra", "buy", "order", "pedido",
    "quote", "cotiza", "precio", "pricing", "plan", "subscribe", "suscribe",
    "agenda", "schedule", "book", "reserva", "cita", "form", "formulario",
    "growth", "scan", "diagnosis", "diagnos", "start", "empieza", "comenzar",
    "free", "gratis", "onboard",
]

SKIP_URL_PATTERNS = [
    r'\.(pdf|zip|png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$',
    r'#',
    r'mailto:',
    r'tel:',
    r'javascript:',
    r'/cdn-cgi/',
    r'/wp-content/',
    r'/static/',
    r'/assets/',
]


def _score_url(url: str, link_text: str) -> int:
    score = 0
    combined = (url + " " + link_text).lower()
    for kw in CONVERSION_URL_KEYWORDS:
        if kw in combined:
            score += 2
    if len(url.rstrip("/").split("/")) > 3:
        score += 1
    return score


async def _extract_elements(page: Page) -> list:
    return await page.evaluate("""() => {
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
        const seen = new Set()
        return els.filter(e => {
            if (seen.has(e.label)) return false
            seen.add(e.label)
            return true
        }).slice(0, 30)
    """)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/screenshots/{screenshot_id}")
async def get_screenshot(screenshot_id: str):
    path = SCREENSHOTS_DIR / f"{screenshot_id}.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Screenshot not found")
    return Response(content=path.read_bytes(), media_type="image/png")


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

        elements = await _extract_elements(page)

        if req.highlight_selector:
            try:
                await page.eval_on_selector(
                    req.highlight_selector,
                    "el => el.style.outline = '3px solid #D9FF8B'"
                )
            except Exception:
                pass

        screenshot_bytes = await page.screenshot(full_page=False)
        title = await page.title()
        await browser.close()

    sid = str(uuid.uuid4())
    (SCREENSHOTS_DIR / f"{sid}.png").write_bytes(screenshot_bytes)

    return {
        "screenshot_url": f"{SERVICE_URL}/screenshots/{sid}",
        "page_title": title,
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

        dl_raw = await page.evaluate("() => window.dataLayer || []")
        datalayer_events = [e for e in dl_raw if isinstance(e, dict)][:20]

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


@app.post("/crawl_site")
async def crawl_site(req: CrawlRequest):
    base_parsed = urlparse(req.url)
    base_domain = f"{base_parsed.scheme}://{base_parsed.netloc}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        try:
            await page.goto(req.url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(req.url, wait_until="domcontentloaded", timeout=30000)

        home_title = await page.title()
        home_elements = await _extract_elements(page)
        home_shot = await page.screenshot(full_page=False)

        # Collect all internal links with their anchor text
        raw_links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                href: a.href,
                text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 80),
            }))
        }""")

        home_sid = str(uuid.uuid4())
        (SCREENSHOTS_DIR / f"{home_sid}.png").write_bytes(home_shot)

        # Filter, deduplicate, and score internal links
        seen_urls = {req.url.rstrip("/")}
        candidates = []
        for link in raw_links:
            href = link.get("href", "")
            text = link.get("text", "")

            # Skip non-internal or unwanted patterns
            if not href.startswith(base_domain):
                continue
            if any(re.search(pat, href, re.I) for pat in SKIP_URL_PATTERNS):
                continue
            normalized = href.rstrip("/")
            if normalized in seen_urls:
                continue
            seen_urls.add(normalized)
            candidates.append({"url": normalized, "text": text, "score": _score_url(normalized, text)})

        # Sort by score descending, take top N
        candidates.sort(key=lambda x: x["score"], reverse=True)
        to_visit = candidates[: req.max_pages - 1]

        pages_data = [{
            "url": req.url,
            "title": home_title,
            "screenshot_url": f"{SERVICE_URL}/screenshots/{home_sid}",
            "interactive_elements": home_elements,
            "conversion_score": 0,
            "is_homepage": True,
        }]

        for candidate in to_visit:
            try:
                await page.goto(candidate["url"], wait_until="networkidle", timeout=25000)
            except Exception:
                try:
                    await page.goto(candidate["url"], wait_until="domcontentloaded", timeout=25000)
                except Exception:
                    continue

            title = await page.title()
            elements = await _extract_elements(page)
            shot = await page.screenshot(full_page=False)
            sid = str(uuid.uuid4())
            (SCREENSHOTS_DIR / f"{sid}.png").write_bytes(shot)

            pages_data.append({
                "url": candidate["url"],
                "title": title,
                "screenshot_url": f"{SERVICE_URL}/screenshots/{sid}",
                "interactive_elements": elements,
                "conversion_score": candidate["score"],
                "is_homepage": False,
            })

        await browser.close()

    # Build site_map summary (url + title + score + top CTAs)
    site_map = []
    for p_data in pages_data:
        cta_labels = [e["label"] for e in p_data["interactive_elements"] if e["tag"] in ("button", "input")][:5]
        site_map.append({
            "url": p_data["url"],
            "title": p_data["title"],
            "conversion_score": p_data["conversion_score"],
            "top_ctas": cta_labels,
            "is_homepage": p_data["is_homepage"],
        })

    return {
        "site_map": site_map,
        "pages": pages_data,
        "crawl_method": "playwright_real",
    }
