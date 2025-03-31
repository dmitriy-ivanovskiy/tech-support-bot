/**
 * AI Service for integrating with OpenRouter.ai to access DeepSeek models
 * This service handles communication with the OpenRouter API for chat completions
 */

interface AIServiceOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  id: string;
  content: string;
  finishReason: string | null;
  createdAt: Date;
}

interface OpenRouterRequestBody {
  model: string;
  messages: Message[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

const defaultOptions: AIServiceOptions = {
  temperature: 0.7,
  maxTokens: 1024,
  stream: false
};

/**
 * AI service for tech support chat application
 * Integrates with OpenRouter.ai to access DeepSeek models
 */
export class AIService {
  private options: AIServiceOptions;
  private apiKey: string;
  private backupApiKey: string;
  private baseUrl: string;
  private systemPrompt: string = 'You are an AI tech support assistant that helps users solve their technical problems. Provide clear, step-by-step instructions. If you need more information to diagnose the issue, ask clarifying questions.';
  private primaryApiKeyFailed: boolean = false;
  private hasGreetedUser: boolean = false;
  private readonly modelName: string = "deepseek/deepseek-r1:free";

  constructor(options: AIServiceOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    this.backupApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY2 || '';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    this.logServiceConfiguration();
    
    if (!this.hasValidApiKeys()) {
      throw new Error('No valid API keys available for the AI service');
    }
  }

  private logServiceConfiguration(): void {
    const hasApiKey = this.hasValidKey(this.apiKey);
    const hasBackupApiKey = this.hasValidKey(this.backupApiKey);
    
    console.log('Primary API Key Available:', hasApiKey ? `Yes (length: ${this.apiKey.length})` : 'No');
    console.log('Backup API Key Available:', hasBackupApiKey ? `Yes (length: ${this.backupApiKey.length})` : 'No');
    
    if (hasApiKey) {
      console.log('Primary API Key Format Check:', this.apiKey.startsWith('sk-') ? 'Valid format (starts with sk-)' : 'Invalid format');
    }
    
    if (hasBackupApiKey) {
      console.log('Backup API Key Format Check:', this.backupApiKey.startsWith('sk-') ? 'Valid format (starts with sk-)' : 'Invalid format');
    }
    
    console.log('API URL:', this.baseUrl);
    console.log('Model:', this.modelName);
    console.log('Environment Variables Available:', 
      Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ') || 'None');
  }

  private hasValidKey(key: string): boolean {
    return !!key && key.length > 0 && key.startsWith('sk-');
  }

  private hasValidApiKeys(): boolean {
    return this.hasValidKey(this.apiKey) || this.hasValidKey(this.backupApiKey);
  }

  private getActiveApiKey(): string {
    return this.primaryApiKeyFailed && this.hasValidKey(this.backupApiKey) ? this.backupApiKey : this.apiKey;
  }

  private prepareRequestBody(messages: Message[], isStreaming: boolean): OpenRouterRequestBody {
    const conversationWithSystemPrompt = this.prepareConversation(messages);
    return {
      model: this.modelName,
      messages: conversationWithSystemPrompt,
      temperature: this.options.temperature!,
      max_tokens: this.options.maxTokens!,
      stream: isStreaming
    };
  }

  private async makeApiRequest(requestBody: OpenRouterRequestBody): Promise<Response> {
    const activeApiKey = this.getActiveApiKey();
    const apiProxyUrl = window.location.origin + '/api/openrouter';

    console.log('Making API request with ' + (this.primaryApiKeyFailed ? 'backup' : 'primary') + ' API key');
    console.log('API Key length:', activeApiKey.length);
    console.log('API Key first 4 chars:', activeApiKey.substring(0, 4));

    return fetch(apiProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenRouter-Key': activeApiKey
      },
      body: JSON.stringify(requestBody)
    });
  }

  private async handleApiError(error: any, response?: Response): Promise<AIResponse> {
    if (response) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('API Error Response Details:', errorText);
      } catch (e) {
        console.error('Could not read error response text:', e);
      }

      // If primary key failed, mark it and throw to trigger retry
      if (response.status === 401 && !this.primaryApiKeyFailed) {
        console.error('Primary API Key authentication failed - trying backup API key');
        this.primaryApiKeyFailed = true;
        throw new Error('Retry with backup key');
      }
    }

    return {
      id: Date.now().toString(),
      content: `I'm currently experiencing some technical difficulties. Please try again in a moment. ${response ? `(Status: ${response.status})` : ''}`,
      finishReason: 'error',
      createdAt: new Date()
    };
  }

  async generateResponse(messages: Message[]): Promise<AIResponse> {
    if (messages.filter(m => m.role === 'user').length > 1) {
      this.hasGreetedUser = true;
    }

    try {
      const requestBody = this.prepareRequestBody(messages, false);
      const response = await this.makeApiRequest(requestBody);

      if (!response.ok) {
        try {
          return await this.handleApiError(null, response);
        } catch (retryError) {
          // Retry with backup key
          return this.generateResponse(messages);
        }
      }

      const data = await response.json();
      this.hasGreetedUser = true;

      return {
        id: data.id || Date.now().toString(),
        content: data.choices[0].message.content,
        finishReason: data.choices[0].finish_reason || 'stop',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error calling AI API:', error);
      return this.handleApiError(error);
    }
  }

  async generateStreamingResponse(messages: Message[]): Promise<ReadableStream<Uint8Array> | null> {
    if (messages.filter(m => m.role === 'user').length > 1) {
      this.hasGreetedUser = true;
    }

    try {
      const requestBody = this.prepareRequestBody(messages, true);
      const response = await this.makeApiRequest(requestBody);

      if (!response.ok) {
        try {
          await this.handleApiError(null, response);
          return null;
        } catch (retryError) {
          // Retry with backup key
          return this.generateStreamingResponse(messages);
        }
      }

      return response.body;
    } catch (error) {
      console.error('Error in streaming request:', error);
      return null;
    }
  }

  prepareConversation(messages: Message[]): Message[] {
    return [
      { role: 'system', content: this.systemPrompt },
      ...messages
    ];
  }
  
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }
  
  getSystemPrompt(): string {
    return this.systemPrompt;
  }
  
  setApiKey(apiKey: string): void {
    if (!this.hasValidKey(apiKey)) {
      console.warn('Attempted to set invalid API key');
      return;
    }
    
    this.apiKey = apiKey;
    this.primaryApiKeyFailed = false;
    console.log('API Key manually set (length: ' + this.apiKey.length + ')');
  }
  
  setBackupApiKey(apiKey: string): void {
    if (!this.hasValidKey(apiKey)) {
      console.warn('Attempted to set invalid backup API key');
      return;
    }
    
    this.backupApiKey = apiKey;
    console.log('Backup API Key manually set (length: ' + this.backupApiKey.length + ')');
    
    // Update primary key if needed
    if (!this.hasValidKey(this.apiKey)) {
      this.apiKey = this.backupApiKey;
      this.backupApiKey = '';
      this.primaryApiKeyFailed = false;
      console.log('No primary key available, promoting backup to primary');
    }
  }
} 