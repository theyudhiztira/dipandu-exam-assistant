# Dipandu Exam Assistant

Checking what you're seeing and getting AI help instantly. The **Dipandu Exam Assistant** is a powerful, stealthy Chrome Extension that allows you to capture regions of your screen, analyze text and images using advanced AI models (via OpenRouter), and get instant answers for multiple choice, essays, translations, and more.

## 🚀 Features

-   **Stealth UI**: A draggable, collapsible floating card that stays out of your way.
-   **Region Capture**: Select precisely what you want the AI to see with an intuitive drag-and-select overlay.
-   **Multi-Modal Analysis**: Uses Google Gemini 2.5 Flash (via OpenRouter) to understand both text and images.
-   **Language Aware**: Automatically responds in the same language as the question detected in the image.
-   **Advanced History**: Keeps track of your scans with a detailed history view including token usage and full context.
-   **Domain Whitelisting**: Configure exactly which websites the assistant should appear on.
-   **Privacy Focused**: Your API key is stored locally in your browser.

## 🛠 Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Build Tool**: Bun (Runtime & Package Manager)
-   **Styling**: Vanilla CSS (Injected via Shadow DOM for isolation)
-   **AI Provider**: OpenRouter API
-   **Extension**: Manifest V3

## 📦 Installation

### Prerequisites
-   [Bun](https://bun.sh/) installed on your machine.
-   Google Chrome (or Chromium-based browser).

### Build from Source

1.  Clone the repository:
    ```bash
    git clone https://github.com/theyudhiztira/dipandu-exam-assistant.git
    cd dipandu-exam-assistant
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Build the extension:
    ```bash
    bun run build
    ```

### Load into Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `dist` folder generated in your project directory.

## 🔑 Configuration

1.  Click the extension icon in your browser toolbar to open the popup.
2.  Enter your **OpenRouter API Key**.
3.  (Optional) Select your preferred AI model ( currently only support Gemini 2.5 Flash ).
4.  Navigate to a website you want to use it on, open the popup settings, and click **Enable** to whitelist the domain.

## 📖 Usage

1.  On a whitelisted domain, you will see a floating "AI Assistant" bubble or card.
2.  Click the maximize button if it's minimized.
3.  Click **Capture Screen**.
4.  Draw a rectangle around the question or text you want to analyze.
5.  (Optional) Select the Question Type (Multiple Choice, Essay, etc.) or add an additional prompt.
6.  Click **Analyze**.
7.  The AI's response will appear in the card. You can copy the result or start a new analysis.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**theyudhiztira** - [GitHub](https://github.com/theyudhiztira)
