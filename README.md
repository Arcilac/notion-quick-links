# Notion Quick Links

A Chrome extension that allows you to quickly access links stored in a Notion database directly from your browser's address bar.

## Features

- Access your links using `get/keyword` directly in the address bar
- Search your Notion links using the omnibox with `get` + Tab + keyword
- Opens links in the current tab
- Simple setup with your Notion API key and database ID

## Installation

### From GitHub

1. Clone or download this repository:

   ```
   git clone https://github.com/Arcilac/notion-quick-links
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner.

4. Click "Load unpacked" and select the folder containing the extension files.

5. The extension should now appear in your extensions list with the Notion Quick Links icon.

## Configuration

Before using the extension, you need to set it up with your Notion API key and database ID:

1. Click on the extension icon in your Chrome toolbar to open the popup.

2. Click on "Settings" to open the options page.

3. Follow the instructions to:

   - Create a Notion integration and get your API key
   - Set up a Notion database with the required columns
   - Share your database with the integration
   - Copy your database ID

4. Enter your Notion API key and database ID in the settings page and click "Save Settings".

### Notion Database Requirements

Your Notion database must have at least two properties:

1. **Name** (title column): This is what you'll search for with the extension.
2. **URL** (URL or text column): The destination URL where you want to go.

Example database structure:

| Name   | URL                               |
| ------ | --------------------------------- |
| github | https://github.com                |
| jira   | https://yourcompany.atlassian.net |
| docs   | https://docs.google.com           |

## Usage

Once configured, you can use the extension in two ways:

### Direct URL Navigation

1. Type `get` in the address bar and press Tab.
2. Type your keyword and Chrome will show suggestions from your Notion database.
3. Press Enter or select a suggestion to navigate to the corresponding URL.

## Troubleshooting

If the extension isn't working:

1. Make sure your Notion API key and database ID are correct.
2. Check that your database has the required columns (Name and URL).
3. Verify that your database is shared with your Notion integration.

## Development

This extension is built using standard web technologies:

- JavaScript
- HTML/CSS
- Chrome Extension APIs
- Notion API
