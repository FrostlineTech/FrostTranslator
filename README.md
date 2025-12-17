# FrostTranslator - BetterDiscord Plugin

Automatically translates Discord messages to your preferred language using the DeepL API. Works seamlessly across channels and servers.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![BetterDiscord](https://img.shields.io/badge/BetterDiscord-Plugin-7289da)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Auto-Translation**: Automatically translates all messages to your chosen language
- **DeepL API**: High-quality translations powered by DeepL (free tier included)
- **26 Languages Supported**: English, Spanish, French, German, Polish, Russian, Japanese, Chinese, and more
- **Smart Detection**: Only translates messages not already in your target language
- **Smart Filtering**: Skips URLs, usernames, and other non-translatable content
- **Show Original**: Option to display original text alongside translations
- **Translation Badge**: Visual indicator showing source → target language
- **Translation Cache**: Caches translations to reduce API calls
- **Rate Limit Protection**: Built-in throttling and retry logic
- **Channel Navigation**: Works seamlessly when switching between channels
- **No Dependencies**: Standalone plugin - no ZeresPluginLibrary required

## Installation

### Prerequisites

- [BetterDiscord](https://betterdiscord.app/) installed

### Steps

1. Download `FrostTranslator.plugin.js`
2. Move the file to your BetterDiscord plugins folder:
   - **Windows**: `%appdata%\BetterDiscord\plugins`
   - **macOS**: `~/Library/Application Support/BetterDiscord/plugins`
   - **Linux**: `~/.config/BetterDiscord/plugins`
3. Open Discord and go to **User Settings** → **Plugins**
4. Enable the **FrostTranslator** plugin
5. Configure your DeepL API key in plugin settings (a free key is included by default)

## Getting a DeepL API Key (Optional)

The plugin includes a free API key, but you can get your own:

1. Go to [DeepL API](https://www.deepl.com/pro-api)
2. Sign up for a free account (500,000 characters/month free)
3. Copy your API key
4. Paste it in the plugin settings

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **DeepL API Key** | Your DeepL API key | Included free key |
| **Target Language** | Language to translate messages into | English (US) |
| **Auto-Translate** | Automatically translate all messages | Enabled |
| **Show Original Text** | Display original text below translation | Enabled |
| **Translate Own Messages** | Also translate your own messages | Disabled |

## Usage

### Automatic Translation

When enabled, the plugin automatically translates all messages that aren't in your target language. Translated messages display:

- The translated text
- A badge showing `SOURCE → TARGET` language
- Optionally, the original text in italics

### Manual Translation

Right-click any message and select **"Translate Message"** to translate on demand (useful when auto-translate is disabled).

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| English (US) | EN-US | English (UK) | EN-GB |
| Spanish | ES | French | FR |
| German | DE | Italian | IT |
| Portuguese (BR) | PT-BR | Portuguese (PT) | PT-PT |
| Russian | RU | Japanese | JA |
| Korean | KO | Chinese | ZH |
| Polish | PL | Dutch | NL |
| Swedish | SV | Danish | DA |
| Finnish | FI | Norwegian | NB |
| Czech | CS | Greek | EL |
| Hungarian | HU | Romanian | RO |
| Bulgarian | BG | Estonian | ET |
| Latvian | LV | Lithuanian | LT |
| Slovak | SK | Slovenian | SL |

## Troubleshooting

### Messages not translating?

- Ensure Auto-Translate is enabled in settings
- Check that your API key is valid
- Try reloading Discord (`Ctrl+R` or `Cmd+R`)
- Check the DevTools console (`Ctrl+Shift+I`) for error messages

### Getting 429 (Rate Limit) errors?

- The plugin has built-in rate limiting protection
- If you see many 429 errors, wait a few seconds and reload Discord
- Consider getting your own DeepL API key for higher limits

### Translation text not visible?

- The plugin uses Discord's CSS variables with fallback colors
- If text is invisible on custom themes, please report the issue

## Technical Notes

- Uses DeepL API (`api-free.deepl.com` for free keys, `api.deepl.com` for Pro)
- Translations are cached per session to minimize API requests
- Uses `BdApi.Net.fetch` for network requests (BetterDiscord's native API)
- MutationObserver watches for new messages and channel changes
- Skips non-translatable content: URLs, phone numbers, usernames, short text

## Author

**Dakota Fryberger** - [FrostlineTech](https://github.com/FrostlineTech)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Changelog

### v1.0.0

- Initial release
- DeepL API integration with free tier support
- Auto-translation with smart language detection
- 26 language options
- Settings panel with API key configuration
- Rate limiting protection with exponential backoff
- Channel navigation support
- Smart content filtering (skips URLs, usernames, etc.)
- Translation caching
- Context menu integration
