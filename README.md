# AI-Powered Website Cloner

This project allows you to clone static snapshots of websites into local files using **Puppeteer**, **Node.js**, and **OpenAI**. The system rewrites links, downloads assets, and preserves the site structure for offline usage.  

---

## Features

- Fetch fully rendered HTML of any public webpage using Puppeteer.
- Rewrite links to local paths for offline browsing.
- Automatically download assets (CSS, JS, images, fonts).
- Handles Next.js optimized images and other dynamic content.
- Uses OpenAI GPT to orchestrate cloning steps in a structured **START → THINK → TOOL → OBSERVE → OUTPUT** workflow.
- CLI-friendly — simply provide a URL to clone.

---

## Prerequisites

- Node.js v18+  
- npm or yarn  
- OpenAI API key  

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/website-cloner.git
cd website-cloner

npm install
# or
yarn install

Create a .env file in the root directory and add your OpenAI API key:

OPENAI_API_KEY=your_openai_api_key_here

Run the script with Node.js and provide the URL you want to clone:
node agent.js

Example inside agent.js:
main("https://code.visualstudio.com/");


Output will be saved in:

mirror/hardcoded_site/
├─ index.html
├─ styles.css
└─ assets/
    ├─ script.js
    └─ image.png
