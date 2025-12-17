/**
 * @name FrostTranslator
 * @author Dakota Fryberger
 * @description Automatically translates messages to your preferred language using DeepL API.
 * @version 1.0.2
 * @authorLink https://github.com/FrostlineTech
 * @source https://github.com/FrostlineTech/FrostTranslator
 * @updateUrl https://raw.githubusercontent.com/FrostlineTech/FrostTranslator/main/FrostTranslator.plugin.js
 */

module.exports = class FrostTranslator {
    constructor() {
        this.name = "FrostTranslator";
        this.version = "1.0.2";
        this.author = "Dakota Fryberger";
        this.description = "Automatically translates messages to your preferred language using DeepL API.";
        
        this.defaultSettings = {
            apiKey: "98ad808c-2684-4020-92d0-cb692043bc18:fx",
            targetLanguage: "EN-US",
            autoTranslate: true,
            showOriginal: true,
            translateOwn: false
        };
        
        this.settings = null;
        this.observer = null;
        this.navigationObserver = null;
        this.currentChannel = null;
        this.translationCache = new Map();
        this.processedMessages = new Set();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 100; // ms between requests
        
        this.languages = [
            { label: "English (US)", value: "EN-US" },
            { label: "English (UK)", value: "EN-GB" },
            { label: "Spanish", value: "ES" },
            { label: "French", value: "FR" },
            { label: "German", value: "DE" },
            { label: "Italian", value: "IT" },
            { label: "Portuguese (BR)", value: "PT-BR" },
            { label: "Portuguese (PT)", value: "PT-PT" },
            { label: "Russian", value: "RU" },
            { label: "Japanese", value: "JA" },
            { label: "Korean", value: "KO" },
            { label: "Chinese (Simplified)", value: "ZH" },
            { label: "Polish", value: "PL" },
            { label: "Dutch", value: "NL" },
            { label: "Swedish", value: "SV" },
            { label: "Danish", value: "DA" },
            { label: "Finnish", value: "FI" },
            { label: "Turkish", value: "TR" },
            { label: "Greek", value: "EL" },
            { label: "Czech", value: "CS" },
            { label: "Romanian", value: "RO" },
            { label: "Hungarian", value: "HU" },
            { label: "Ukrainian", value: "UK" },
            { label: "Indonesian", value: "ID" },
            { label: "Bulgarian", value: "BG" },
            { label: "Estonian", value: "ET" },
            { label: "Latvian", value: "LV" },
            { label: "Lithuanian", value: "LT" },
            { label: "Slovak", value: "SK" },
            { label: "Slovenian", value: "SL" }
        ];
        
        this.css = `
            .translator-container {
                margin-top: 4px;
            }
            .translator-translated {
                color: var(--text-normal, var(--header-primary, #dcddde));
                padding: 2px 0;
            }
            .translator-original {
                color: var(--text-muted, #ffffffff);
                font-size: 0.85em;
                font-style: italic;
                padding: 2px 0;
                border-left: 2px solid var(--brand-experiment);
                padding-left: 8px;
                margin-top: 4px;
            }
            .translator-badge {
                background: var(--brand-experiment);
                color: white;
                font-size: 10px;
                padding: 1px 6px;
                border-radius: 10px;
                margin-left: 8px;
                vertical-align: middle;
            }
            .translator-loading {
                color: var(--text-muted);
                font-style: italic;
            }
            .translator-error {
                color: var(--text-danger);
                font-size: 0.85em;
            }
            .translator-settings {
                padding: 10px;
                color: var(--text-normal);
            }
            .translator-settings-group {
                margin-bottom: 20px;
            }
            .translator-settings-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--header-primary);
            }
            .translator-settings-group .note {
                font-size: 12px;
                color: var(--text-muted);
                margin-bottom: 8px;
            }
            .translator-settings-group input[type="text"],
            .translator-settings-group select {
                width: 100%;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid var(--background-tertiary);
                background: var(--background-secondary);
                color: var(--text-normal);
                font-size: 14px;
            }
            .translator-settings-group input[type="checkbox"] {
                width: 20px;
                height: 20px;
                margin-right: 10px;
                vertical-align: middle;
            }
            .translator-switch-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .translator-switch-label {
                flex: 1;
            }
        `;
    }

    loadSettings() {
        this.settings = BdApi.Data.load(this.name, "settings") || { ...this.defaultSettings };
    }

    saveSettings() {
        BdApi.Data.save(this.name, "settings", this.settings);
    }

    start() {
        this.loadSettings();
        BdApi.DOM.addStyle(this.name, this.css);
        this.startNavigationObserver();
        this.startObserver();
        this.processExistingMessages();
        BdApi.UI.showToast("Translator started!", { type: "success" });
    }

    stop() {
        BdApi.DOM.removeStyle(this.name);
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.navigationObserver) {
            this.navigationObserver.disconnect();
            this.navigationObserver = null;
        }
        
        this.translationCache.clear();
        this.processedMessages.clear();
        
        document.querySelectorAll('.translator-container').forEach(el => el.remove());
        document.querySelectorAll('[id^="message-content-"]').forEach(el => {
            el.style.display = '';
        });
        
        BdApi.UI.showToast("Translator stopped!", { type: "info" });
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.className = "translator-settings";
        
        // API Key
        panel.innerHTML = `
            <div class="translator-settings-group">
                <label>DeepL API Key</label>
                <div class="note">Your DeepL API key (get one free at deepl.com/pro-api)</div>
                <input type="text" id="translator-apiKey" value="${this.settings.apiKey || ''}" />
            </div>
            
            <div class="translator-settings-group">
                <label>Target Language</label>
                <div class="note">The language to translate messages into</div>
                <select id="translator-targetLanguage">
                    ${this.languages.map(lang => 
                        `<option value="${lang.value}" ${this.settings.targetLanguage === lang.value ? 'selected' : ''}>${lang.label}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="translator-settings-group">
                <label>Options</label>
                <div class="translator-switch-row">
                    <input type="checkbox" id="translator-autoTranslate" ${this.settings.autoTranslate ? 'checked' : ''} />
                    <div class="translator-switch-label">
                        <strong>Auto-Translate</strong>
                        <div class="note">Automatically translate all messages</div>
                    </div>
                </div>
                <div class="translator-switch-row">
                    <input type="checkbox" id="translator-showOriginal" ${this.settings.showOriginal ? 'checked' : ''} />
                    <div class="translator-switch-label">
                        <strong>Show Original Text</strong>
                        <div class="note">Display original text alongside translation</div>
                    </div>
                </div>
                <div class="translator-switch-row">
                    <input type="checkbox" id="translator-translateOwn" ${this.settings.translateOwn ? 'checked' : ''} />
                    <div class="translator-switch-label">
                        <strong>Translate Own Messages</strong>
                        <div class="note">Also translate your own messages</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            const apiKeyInput = panel.querySelector('#translator-apiKey');
            const targetLangSelect = panel.querySelector('#translator-targetLanguage');
            const autoTranslateCheck = panel.querySelector('#translator-autoTranslate');
            const showOriginalCheck = panel.querySelector('#translator-showOriginal');
            const translateOwnCheck = panel.querySelector('#translator-translateOwn');
            
            if (apiKeyInput) {
                apiKeyInput.addEventListener('change', (e) => {
                    this.settings.apiKey = e.target.value;
                    this.saveSettings();
                });
            }
            
            if (targetLangSelect) {
                targetLangSelect.addEventListener('change', (e) => {
                    this.settings.targetLanguage = e.target.value;
                    this.saveSettings();
                });
            }
            
            if (autoTranslateCheck) {
                autoTranslateCheck.addEventListener('change', (e) => {
                    this.settings.autoTranslate = e.target.checked;
                    this.saveSettings();
                });
            }
            
            if (showOriginalCheck) {
                showOriginalCheck.addEventListener('change', (e) => {
                    this.settings.showOriginal = e.target.checked;
                    this.saveSettings();
                });
            }
            
            if (translateOwnCheck) {
                translateOwnCheck.addEventListener('change', (e) => {
                    this.settings.translateOwn = e.target.checked;
                    this.saveSettings();
                });
            }
        }, 0);
        
        return panel;
    }

    async translateText(text, targetLang, retryCount = 0) {
        if (!text || text.trim() === '') {
            return null;
        }
        
        // Skip non-translatable content
        if (this.shouldSkipTranslation(text)) {
            console.log("[FrostTranslator] Skipping non-translatable:", text.substring(0, 30));
            return null;
        }
        
        const apiKey = this.settings.apiKey;
        if (!apiKey) {
            console.error("[FrostTranslator] No API key configured");
            return null;
        }
        
        const cacheKey = `${text}_${targetLang}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        console.log("[FrostTranslator] Translating:", text.substring(0, 50) + "...");

        try {
            const isFreeKey = apiKey.endsWith(':fx');
            const baseUrl = isFreeKey 
                ? 'https://api-free.deepl.com/v2/translate'
                : 'https://api.deepl.com/v2/translate';
            
            const postData = `text=${encodeURIComponent(text)}&target_lang=${encodeURIComponent(targetLang)}`;
            
            // Throttle requests
            const response = await this.throttledRequest(async () => {
                return BdApi.Net.fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `DeepL-Auth-Key ${apiKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: postData
                });
            });
            
            // Handle rate limiting with retry
            if (response.status === 429) {
                if (retryCount < 3) {
                    const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    console.log(`[FrostTranslator] Rate limited, retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.translateText(text, targetLang, retryCount + 1);
                } else {
                    console.error("[FrostTranslator] Rate limit exceeded after retries");
                    return null;
                }
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[FrostTranslator] DeepL API error:", response.status, errorText);
                return null;
            }
            
            const data = await response.json();
            
            if (data && data.translations && data.translations[0]) {
                const translation = data.translations[0];
                const result = {
                    translatedText: translation.text,
                    detectedLang: translation.detected_source_language || 'unknown',
                    originalText: text
                };

                this.translationCache.set(cacheKey, result);
                return result;
            } else {
                console.error("[FrostTranslator] Unexpected response format:", data);
                return null;
            }
        } catch (error) {
            console.error("[FrostTranslator] Translation error:", error);
            return null;
        }
    }

    needsTranslation(detectedLang, targetLang) {
        const normalizedDetected = detectedLang.toLowerCase().split('-')[0];
        const normalizedTarget = targetLang.toLowerCase().split('-')[0];
        return normalizedDetected !== normalizedTarget;
    }

    shouldSkipTranslation(text) {
        // Skip URLs
        if (/^https?:\/\/\S+$/i.test(text.trim())) return true;
        // Skip Discord invite links
        if (/^discord\.gg\/\S+$/i.test(text.trim())) return true;
        // Skip pure numbers/phone numbers
        if (/^[\d\s\-\+\(\)]+$/.test(text.trim())) return true;
        // Skip very short text (1-2 chars)
        if (text.trim().length <= 2) return true;
        // Skip usernames (no spaces, alphanumeric with underscores)
        if (/^[a-zA-Z0-9_]+$/.test(text.trim()) && text.length < 30) return true;
        return false;
    }

    async throttledRequest(fn) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime = Date.now();
        return fn();
    }

    startNavigationObserver() {
        // Watch for channel/chat changes by observing the main content area
        const appMount = document.getElementById('app-mount');
        if (!appMount) {
            setTimeout(() => this.startNavigationObserver(), 1000);
            return;
        }

        this.navigationObserver = new MutationObserver(() => {
            // Check if channel changed by looking at the URL or chat header
            const channelId = window.location.pathname;
            
            if (this.currentChannel !== channelId) {
                this.currentChannel = channelId;
                console.log("[FrostTranslator] Channel changed, reinitializing...");
                
                // Clear processed messages for the new channel
                this.processedMessages.clear();
                
                // Disconnect old observer and start fresh
                if (this.observer) {
                    this.observer.disconnect();
                    this.observer = null;
                }
                
                // Small delay to let Discord render the new chat
                setTimeout(() => {
                    this.startObserver();
                    this.processExistingMessages();
                }, 500);
            }
        });

        this.navigationObserver.observe(appMount, {
            childList: true,
            subtree: true
        });
        
        // Set initial channel
        this.currentChannel = window.location.pathname;
    }

    startObserver() {
        const messagesContainer = document.querySelector('[class*="messagesWrapper"]');
        
        if (!messagesContainer) {
            setTimeout(() => this.startObserver(), 1000);
            return;
        }

        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processNode(node);
                    }
                }
            }
        });

        this.observer.observe(messagesContainer, {
            childList: true,
            subtree: true
        });
    }

    processNode(node) {
        if (!this.settings.autoTranslate) return;

        const messageContents = node.querySelectorAll ? 
            node.querySelectorAll('[id^="message-content-"]') : [];
        
        if (node.id && node.id.startsWith('message-content-')) {
            this.translateMessage(node);
        }

        messageContents.forEach(content => this.translateMessage(content));
    }

    processExistingMessages() {
        if (!this.settings.autoTranslate) return;

        const messageContents = document.querySelectorAll('[id^="message-content-"]');
        messageContents.forEach(content => this.translateMessage(content));
    }

    async translateMessage(element) {
        const messageId = element.id;
        
        if (this.processedMessages.has(messageId)) return;
        this.processedMessages.add(messageId);

        const originalText = element.textContent.trim();
        if (!originalText) return;

        const targetLang = this.settings.targetLanguage;

        const loadingEl = document.createElement('div');
        loadingEl.className = 'translator-container translator-loading';
        loadingEl.textContent = 'Translating...';
        element.parentNode.insertBefore(loadingEl, element.nextSibling);

        const result = await this.translateText(originalText, targetLang);
        
        loadingEl.remove();

        if (result) {
            if (!this.needsTranslation(result.detectedLang, targetLang)) {
                return;
            }

            const container = document.createElement('div');
            container.className = 'translator-container';

            const translatedEl = document.createElement('div');
            translatedEl.className = 'translator-translated';
            translatedEl.innerHTML = `
                ${result.translatedText}
                <span class="translator-badge">${result.detectedLang.toUpperCase()} → ${targetLang.toUpperCase()}</span>
            `;
            container.appendChild(translatedEl);

            if (this.settings.showOriginal) {
                const originalEl = document.createElement('div');
                originalEl.className = 'translator-original';
                originalEl.textContent = `Original: ${originalText}`;
                container.appendChild(originalEl);

                element.style.display = 'none';
            }

            element.parentNode.insertBefore(container, element.nextSibling);
        }
    }
};
