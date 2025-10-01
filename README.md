# TfL (Transport for London) Status & Journey Planner MCP Server

This [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server provides AI assistants with access to real-time Transport for London data through a set of automated tools.

> **⚠️ Important Disclaimer:** This is **not an official Transport for London (TfL) MCP server**. This is an independent project that uses the publicly available [TfL Unified API](https://api.tfl.gov.uk/) to provide transport data. It is not affiliated with, endorsed by, or officially supported by Transport for London.

## Demo Video
![TfL MCP Server Demo](./assets/demo.gif)

## 🚇 What This MCP Server Does

This server enables AI assistants (like Claude Desktop and VS Code GitHub Copilot) to access live TfL data by providing three main capabilities:

### 🔧 Available Tools

1. **`get_line_status`** - Get the current status of any TfL line (e.g., Central, Victoria, Piccadilly)
2. **`get_line_status_detail`** - Get detailed status information including disruption details for a TfL line  
3. **`plan_journey`** - Plan journeys between two locations using the TfL Journey Planner

### 🎯 Use Cases

With this MCP server connected, AI assistants can help users:
- Check if their tube line is running normally before commuting
- Get detailed information about service disruptions
- Plan optimal routes between London locations
- Provide real-time transport advice for London travel

Example interactions:
- *"Is the Central line running normally?"*
- *"Plan a journey from King's Cross to Heathrow Airport"*
- *"What's causing delays on the Northern line today?"*

Let's set things up!

## 🚦 Getting Started

Choose your preferred installation method:

## 📦 Option 1: Quick Install via npm (Recommended)

The easiest way to use this MCP server is through npm:

### Installation

```sh
npm install -g london-transport-mcp
```

### 🔐 Set up your TfL API key

You can get a free API key from the [TfL API Portal](https://api.tfl.gov.uk/).

**Method 1: Environment Variable (Recommended)**
Set the environment variable in your system:

```sh
# Windows (PowerShell)
$env:TFL_API_KEY="your_actual_tfl_api_key_here"

# macOS/Linux
export TFL_API_KEY="your_actual_tfl_api_key_here"
```

**Method 2: MCP Configuration**
Include the API key directly in your MCP configuration (see examples below).

### AI Assistant Configuration

**For Claude Desktop** (Settings → Developers → Edit Config):
```json
{
  "mcpServers": {
    "london-transport": {
      "command": "npx",
      "args": ["london-transport-mcp"],
      "env": {
        "TFL_API_KEY": "your_actual_tfl_api_key_here"
      }
    }
  }
}
```

**For VS Code GitHub Copilot** (Settings → GitHub Copilot › MCP: Servers):
```json
{
  "london-transport": {
    "command": "npx",
    "args": ["london-transport-mcp"],
    "env": {
      "TFL_API_KEY": "your_actual_tfl_api_key_here"
    }
  }
}
```

That's it! No manual installation or path configuration required.

---

## 🛠️ Option 2: Local Development Setup

For developers who want to modify the code or contribute:

### ⚙️ Prerequisites

Before starting, please ensure you have:

- [Node.js (v18+ required, v20+ recommended)](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (included with Node)

Warning: if you run with a lower version of Node, `fetch` won't be present. Tools use `fetch` to make HTTP calls. To work around this, you can modify the tools to use `node-fetch` instead. Make sure that `node-fetch` is installed as a dependency and then import it as `fetch` into each tool file.

### 📥 Installation & Setup

**1. Clone the repository**

```sh
git clone https://github.com/anoopt/london-tfl-journey-status-mcp-server.git
cd london-tfl-journey-status-mcp-server
```

**2. Install dependencies**

```sh
npm install
```

### 🔐 Set up your TfL API key

**3. Configure your TfL API key**

Create a `.env` file in the project root with your TfL API key:

```env
TFL_API_KEY=your_actual_tfl_api_key_here
```

You can get a free API key from the [TfL API Portal](https://api.tfl.gov.uk/).

## 🧪 Test the MCP Server with Postman

**We strongly recommend testing your MCP server with Postman before connecting it to an AI assistant.** The Postman Desktop Application provides the easiest way to run and test MCP servers.

### Step 1: Download Postman Desktop

Download the latest Postman Desktop Application from [postman.com/downloads](https://www.postman.com/downloads/).

### Step 2: Create an MCP Request

1. Open Postman Desktop
2. Create a new **MCP Request** (see the [documentation](https://learning.postman.com/docs/postman-ai-agent-builder/mcp-requests/create/) for detailed steps)
3. Set the type to **STDIO**
4. Set the command to the full path to your node executable followed by the full path to `mcpServer.js`

To get the required paths, run these commands in your terminal:

```sh
# Get the full path to node
which node

# Get the full path to mcpServer.js  
realpath mcpServer.js

# Check your node version (should be 18+)
node --version
```

Example command format:
```
/usr/local/bin/node /full/path/to/TfL-Status-MCP-Server/mcpServer.js
```

### Step 3: Test Your Tools

1. Click **Connect** in your Postman MCP Request
2. You should see the three TfL tools listed
3. Test each tool:
   - Try `get_line_status` with `lineId: "central"`
   - Try `plan_journey` with `fromLocation: "King's Cross"` and `toLocation: "Westminster"`
   - Try `get_line_status_detail` with `lineId: "piccadilly"`

If all tools work correctly in Postman, you're ready to connect to an AI assistant!

## 🤖 Connect to AI Assistants

Once you've tested with Postman, you can connect your MCP server to AI assistants:

### For Local Development Setup (Option 2)

If you're using the local development setup, you'll need to specify full paths:

### Claude Desktop

**Step 1**: Use the same node and mcpServer.js paths from the Postman testing step.

**Step 2**: Open Claude Desktop → **Settings** → **Developers** → **Edit Config** and add:

```json
{
  "mcpServers": {
    "london-transport": {
      "command": "node",
      "args": ["/full/path/to/mcpServer.js"]
    }
  }
}
```

**Step 3**: Restart Claude Desktop and verify the MCP server shows with a green circle.

### VS Code GitHub Copilot

**Step 1**: Install the [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) extension in VS Code if you haven't already.

**Step 2**: Open VS Code → **Settings** (Ctrl+,) → Search for "MCP" → **GitHub Copilot › MCP: Servers**

**Step 3**: Add your TfL MCP server configuration:

```json
{
  "london-transport": {
    "command": "node",
    "args": ["/full/path/to/mcpServer.js"]
  }
}
```

**Step 4**: Restart VS Code and the MCP server will be available to GitHub Copilot.

Now you can ask your AI assistant things like:
- *"Check the status of the Central line"*
- *"Plan a journey from London Bridge to Camden Town"*

### Additional Options

#### 🛠️ List Available Tools

View all available tools and their parameters:

```sh
npm run list-tools
```

#### 🚀 Quick Postman Integration

Open Postman with the correct MCP configuration automatically:

```sh
npm run postman
```

#### 🐳 Docker Deployment (Production)

For production deployments, you can use Docker:

**1. Build Docker image**

```sh
docker build -t <your_server_name> .
```

**2. AI Assistant Integration**

Add Docker server configuration to your AI assistant:

**For Claude Desktop** (Settings → Developers → Edit Config):

```json
{
  "mcpServers": {
    "tfl-status": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--env-file=.env", "tfl-mcp-server"]
    }
  }
}
```

**For VS Code GitHub Copilot** (Settings → GitHub Copilot › MCP: Servers):

```json
{
  "tfl-status": {
    "command": "docker",
    "args": ["run", "-i", "--rm", "--env-file=.env", "tfl-mcp-server"]
  }
}
```

> Add your environment variables (API keys, etc.) inside the `.env` file.

The project comes bundled with the following minimal Docker setup:

```dockerfile
FROM node:22.12-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENTRYPOINT ["node", "mcpServer.js"]
```

#### 🌐 Streamable HTTP

To run the server with Streamable HTTP support, use the `--streamable-http` flag. This launches the server with the `/mcp` endpoint enabled:

```sh
node mcpServer.js --streamable-http
```

#### 🌐 Server-Sent Events (SSE)

To run the server with Server-Sent Events (SSE) support, use the `--sse` flag. This launches the server with the `/sse` and `/messages` endpoints enabled:

```sh
node mcpServer.js --sse
```

#### 🖥️ Stdio (Standard Input/Output)

To run the server using standard input/output (stdio), simply run the script without any flags. This mode is ideal for CLI tools or programmatic integration via stdin and stdout.

```sh
node mcpServer.js
```

## 🛠️ Extending the Server

To add more TfL API endpoints or other transport APIs:

1. Create new tool files in the [`tools/tfl/`](tools/tfl/) directory
2. Follow the pattern in existing tools like [`tools/tfl/status.js`](tools/tfl/status.js)
3. Add your new tool file to [`tools/paths.js`](tools/paths.js)
4. Test with Postman before deploying

## 📚 API Reference

This server uses the [Transport for London Unified API](https://api.tfl.gov.uk/). All tools automatically include your API key from the `.env` file.

## ➕ Adding New Tools

Extend your MCP server with more tools easily:

1. Visit [Postman MCP Generator](https://postman.com/explore/mcp-generator).
2. Pick new API request(s), generate a new MCP server, and download it.
3. Copy new generated tool(s) into your existing project's `tools/` folder.
4. Update your `tools/paths.js` file to include new tool references.

## 💬 Questions & Support

Visit the [Postman MCP Generator](https://postman.com/explore/mcp-generator) page for updates and new capabilities.

Join the `#mcp-lab` channel in the [Postman Discord](https://discord.gg/PQAWcPkprM) to share what you've built and get help.
