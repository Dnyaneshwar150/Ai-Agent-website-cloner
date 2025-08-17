
import 'dotenv/config';
import { OpenAI } from 'openai';
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";



export async function fetchPage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content();
  await browser.close();
  return html;
}

// 2. Rewrite HTML for local usage and save
export async function rewriteHtmlForLocal(html, outDir) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // rewrite <a>, <img>, <script>, <link>
  document.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("http")) {
      a.setAttribute("href", path.basename(href) + ".html");
    }
  });

  document.querySelectorAll("img[src], script[src], link[href]").forEach(el => {
    let attr = el.tagName === "LINK" ? "href" : "src";
    let val = el.getAttribute(attr);
    if (val && val.startsWith("http")) {
      el.setAttribute(attr, "./assets/" + path.basename(val));
    }
  });

  // ensure outDir exists
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, "index.html");
  fs.writeFileSync(filePath, dom.serialize(), "utf8");

  return `HTML saved at ${filePath}`;
}

// 3. Download assets
export async function downloadAssets(assets, outDir) {
  fs.mkdirSync(outDir, { recursive: true });

  for (const assetUrl of assets) {
    try {
      const response = await axios.get(assetUrl, { responseType: "arraybuffer" });
      const filename = path.basename(assetUrl.split("?")[0]);
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, response.data);
    } catch (err) {
      console.error("Failed to download:", assetUrl, err.message);
    }
  }

  return `Assets saved in ${outDir}`;
}

// 4. Discover links
export function discoverLinks(html) {
  const dom = new JSDOM(html);
  const links = [];
  dom.window.document.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("http")) {
      links.push(href);
    }
  });
  return links;
}

const TOOL_MAP = {
  fetchPage: fetchPage,
  rewriteHtmlForLocal: rewriteHtmlForLocal,
  downloadAssets: downloadAssets,
  discoverLinks: discoverLinks,
};

console.log(fetchPage)

        const openai = new OpenAI({ apiKey: 'My API Key' });
const client = new OpenAI();

async function main() {
  // These api calls are stateless (Chain Of Thought)
const SYSTEM_PROMPT = `
You are an AI assistant who works on START, THINK, TOOL, OBSERVE and OUTPUT format.
For a given user query first think and breakdown the problem into sub problems.
You should always keep thinking and thinking before giving the actual output.

Also, before outputting the final result to the user you must check once if everything is correct.

You also have a list of available tools that you can call based on user query.

For every tool call that you make, wait for the OBSERVATION from the tool which is the
response from the tool that you called.

Available Tools:
- fetchPage(url: string): Returns the rendered HTML of the page at the given URL.
- rewriteHtmlForLocal(html: string, outDir: string): Rewrites links/assets in HTML for local usage and saves file.
- downloadAssets(assets: string[], outDir: string): Downloads assets (CSS, JS, images, fonts) and saves locally.
- discoverLinks(html: string): Extracts URLs from the HTML for further crawling.

Rules:
- Strictly follow the output JSON format
- Always follow the output in sequence that is START, THINK, TOOL, OBSERVE, THINK, OUTPUT
- Always perform only one step at a time and wait for other step
- Always make sure to do multiple steps of thinking before giving out output
- For every tool call always wait for the OBSERVE which contains the output from tool


Output JSON Format:
{"step": "START | THINK | TOOL | OBSERVE | OUTPUT", "content": "string", "tool_name": "string", "input": "string" }

Example:
User: Clone the homepage of https://example.com

ASSISTANT: {"step": "START", "content":"The goal is to clone the homepage of https://example.com into static offline files."}

ASSISTANT: {"step": "THINK", "content":"First, I need to fetch the HTML of the given URL."}

ASSISTANT: {"step": "TOOL", "tool_name":"fetchPage", "input":"https://example.com"}

DEVELOPER: {"step": "OBSERVE", "content":"<!DOCTYPE html> ... full HTML ..."}

ASSISTANT: {"step": "THINK", "content":"I received the HTML. Next, I should rewrite it so links point to local paths."}

ASSISTANT: {"step": "TOOL", "tool_name":"rewriteHtmlForLocal", "input":"{ html: '<!DOCTYPE html>...', outDir: 'mirror/site' }"}

DEVELOPER: {"step": "OBSERVE", "content":"HTML saved at mirror/site/index.html with rewritten links."}

ASSISTANT: {"step": "THINK", "content":"Now I need to fetch and save the assets linked in this page (CSS, JS, images)."}

ASSISTANT: {"step": "TOOL", "tool_name":"downloadAssets", "input":"{ assets: ['style.css','script.js'], outDir: 'mirror/site/assets' }"}

DEVELOPER: {"step": "OBSERVE", "content":"Assets saved locally."}

ASSISTANT: {"step": "THINK", "content":"Great, I saved the HTML and assets. Cloning is successful."}

ASSISTANT: {"step": "OUTPUT", "content":"The homepage of https://example.com has been cloned successfully into mirror/site."}
`;

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content:
        'Clone the homepage of https://hitesh.ai/ into static offline files.',
    },
  ];

  while (true) {
        const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: messages,
    });

     const rawContent = response.choices[0].message.content;
    const parsedContent = JSON.parse(rawContent);

    messages.push({
      role: 'assistant',
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step === 'START') {
      console.log(`🔥`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === 'THINK') {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === 'TOOL') {
      const toolToCall = parsedContent.tool_name;
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: 'developer',
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }

      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️: ${toolToCall}(${parsedContent.input}) = `,
        responseFromTool
      );
      messages.push({
        role: 'developer',
        content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
      });
      continue;
    }

    if (parsedContent.step === 'OUTPUT') {
      console.log(`🤖`, parsedContent.content);
      break;
    }
  }

  console.log('Done...');
}

main();
