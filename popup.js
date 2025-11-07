// 智能提示词工具 - 弹窗脚本
class PopupManager {
  constructor() {
    this.currentTab = null;
    this.isSupported = false;
    this.promptCount = 0;
    
    this.init();
  }

  async init() {
    // 获取当前标签页
    await this.getCurrentTab();
    
    // 检查页面支持状态
    this.checkPageSupport();
    
    // 加载提示词数量
    await this.loadPromptCount();
    
    // 绑定事件
    this.bindEvents();
    
    // 更新状态显示
    this.updateStatus();
  }

  // 获取当前标签页
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
    } catch (error) {
      console.error('获取当前标签页失败:', error);
    }
  }

  // 检查页面支持状态
  checkPageSupport() {
    if (!this.currentTab) {
      this.isSupported = false;
      return;
    }

    const url = this.currentTab.url;
    const supportedDomains = [
      'chat.openai.com',
      'chatgpt.com',
      'chat.deepseek.com',
      'www.deepseek.com'
    ];

    this.isSupported = supportedDomains.some(domain => url.includes(domain));
  }

  // 加载提示词数量
  async loadPromptCount() {
    try {
      const result = await chrome.storage.sync.get(['prompts']);
      const prompts = result.prompts || [];
      this.promptCount = prompts.length;
    } catch (error) {
      console.error('加载提示词数量失败:', error);
      this.promptCount = 0;
    }
  }

  // 绑定事件
  bindEvents() {
    // 切换悬浮窗
    document.getElementById('toggle-window').addEventListener('click', () => {
      this.toggleFloatingWindow();
    });

    // 管理提示词
    document.getElementById('manage-prompts').addEventListener('click', () => {
      this.openPromptManager();
    });

    // 设置
    document.getElementById('settings').addEventListener('click', () => {
      this.openSettings();
    });

    // 帮助
    document.getElementById('help').addEventListener('click', () => {
      this.openHelp();
    });
  }

  // 切换悬浮窗
  async toggleFloatingWindow() {
    if (!this.isSupported) {
      this.showMessage('当前页面不支持此功能', 'error');
      return;
    }

    const button = document.getElementById('toggle-window');
    const originalText = button.innerHTML;
    
    // 显示加载状态
    button.innerHTML = '<span class="loading"></span> 操作中...';
    button.disabled = true;

    try {
      // 向内容脚本发送消息
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'toggleWindow'
      });

      if (response && response.success) {
        this.showMessage('悬浮窗状态已切换', 'success');
      } else {
        this.showMessage('操作失败，请刷新页面后重试', 'error');
      }
    } catch (error) {
      console.error('切换悬浮窗失败:', error);
      this.showMessage('操作失败，请确保页面已加载完成', 'error');
    } finally {
      // 恢复按钮状态
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  // 打开提示词管理器
  openPromptManager() {
    // 创建新标签页打开管理器
    chrome.tabs.create({
      url: chrome.runtime.getURL('prompt-manager.html')
    });
  }

  // 打开设置页面
  openSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('settings.html')
    });
  }

  // 打开帮助页面
  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/your-repo/prompt-tool-plugin#readme'
    });
  }

  // 更新状态显示
  updateStatus() {
    // 更新页面检测状态
    const pageIndicator = document.getElementById('page-indicator');
    const pageStatus = document.getElementById('page-status');
    
    if (this.isSupported) {
      pageIndicator.className = 'status-indicator active';
      pageStatus.textContent = '已支持';
    } else {
      pageIndicator.className = 'status-indicator inactive';
      pageStatus.textContent = '不支持';
    }

    // 更新工具状态
    const toolIndicator = document.getElementById('tool-indicator');
    const toolStatus = document.getElementById('tool-status');
    
    if (this.isSupported) {
      toolIndicator.className = 'status-indicator active';
      toolStatus.textContent = '已就绪';
    } else {
      toolIndicator.className = 'status-indicator inactive';
      toolStatus.textContent = '未就绪';
    }

    // 更新提示词数量
    document.getElementById('prompt-count').textContent = this.promptCount;
  }

  // 显示消息
  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

// 初始化弹窗管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
