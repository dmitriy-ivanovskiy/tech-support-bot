# Tech Support Chatbot

A modern, AI-powered tech support chatbot that helps users troubleshoot common technical issues. Built with Next.js and TypeScript, it provides real-time assistance through natural language conversations, tracks analytics, and learns from user feedback.

## Live Demo

Check out the live deployment of the application at:
[https://tech-support-bot-two.vercel.app/](https://tech-support-bot-two.vercel.app/)
## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tech-support-chatbot.git
cd tech-support-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
# OpenRouter API keys for DeepSeek model access
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_OPENROUTER_API_KEY2=your_backup_openrouter_api_key_here (optional)
NEXT_PUBLIC_APP_URL=your_application_url
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Start a new conversation by clicking the "New Chat" button
2. Type your technical issue in the chat input
3. The chatbot will respond with troubleshooting steps
4. You can:
   - Upload screenshots or error logs using the attachment button
   - Provide feedback on responses using thumbs up/down
   - View conversation history in the sidebar
   - Check usage analytics in the dashboard

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 