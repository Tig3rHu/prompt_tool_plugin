// 智能提示词工具 - 内容脚本
class PromptTool {
  constructor() {
    this.isInitialized = false;
    this.floatingWindow = null;
    this.isMinimized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.prompts = [];
    this.currentPlatform = this.detectPlatform();
    
    this.init();
  }

  // 检测当前平台
  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return 'chatgpt';
    } else if (hostname.includes('deepseek.com')) {
      return 'deepseek';
    }
    return 'unknown';
  }

  // 初始化插件
  async init() {
    if (this.isInitialized) return;
    
    console.log('智能提示词工具初始化中...', this.currentPlatform);
    
    // 等待页面加载完成
    await this.waitForPageLoad();
    
    // 加载提示词数据
    await this.loadPrompts();
    
    // 创建悬浮窗
    this.createFloatingWindow();
    
    // 监听页面变化
    this.observePageChanges();
    
    // 监听窗口大小变化
    this.bindWindowResize();
    
    this.isInitialized = true;
    console.log('智能提示词工具初始化完成');
  }

  // 等待页面加载完成
  async waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  // 加载提示词数据
  async loadPrompts() {
    try {
      const result = await chrome.storage.sync.get(['prompts']);
      this.prompts = result.prompts || this.getDefaultPrompts();
    } catch (error) {
      console.error('加载提示词失败:', error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  // 获取默认提示词
  getDefaultPrompts() {
    return [
      {
        id: 1,
        title: "代码审查",
        content: "请帮我审查以下代码，重点关注：\n1. 代码质量和最佳实践\n2. 潜在的性能问题\n3. 安全性问题\n4. 可读性和维护性\n\n代码：\n```\n[在此处粘贴代码]\n```"
      },
      {
        id: 2,
        title: "需求分析",
        content: "请帮我分析以下需求，并提供：\n1. 功能点拆解\n2. 技术实现方案\n3. 潜在风险和挑战\n4. 开发时间估算\n\n需求描述：\n[在此处描述需求]"
      },
      {
        id: 3,
        title: "错误调试",
        content: "我遇到了以下错误，请帮我分析：\n1. 错误原因分析\n2. 解决方案建议\n3. 预防措施\n\n错误信息：\n```\n[在此处粘贴错误信息]\n```\n\n相关代码：\n```\n[在此处粘贴相关代码]\n```"
      },
      {
        id: 4,
        title: "学习总结",
        content: "请帮我总结以下内容的学习要点：\n1. 核心概念和原理\n2. 实际应用场景\n3. 最佳实践\n4. 常见问题和解决方案\n\n学习内容：\n[在此处描述学习内容]"
      },
      {
        id: 5,
        title: "文档编写",
        content: "请帮我编写以下内容的文档：\n1. 功能概述\n2. 使用说明\n3. 参数说明\n4. 示例代码\n5. 注意事项\n\n功能描述：\n[在此处描述功能]"
      },
      {
        id: 6,
        title: "创意写作",
        content: "请帮我创作一个关于以下主题的内容：\n1. 引人入胜的开头\n2. 丰富的情节发展\n3. 生动的描述和对话\n4. 令人满意的结尾\n\n主题：\n[在此处描述主题]"
      },
      {
        id: 7,
        title: "数据分析",
        content: "请帮我分析以下数据，并提供：\n1. 数据概览和统计摘要\n2. 关键趋势和模式识别\n3. 异常值检测和分析\n4. 实用的洞察和建议\n\n数据：\n[在此处粘贴或描述数据]"
      },
      {
        id: 8,
        title: "翻译润色",
        content: "请帮我翻译并润色以下内容：\n1. 准确传达原意\n2. 符合目标语言习惯\n3. 保持原文风格和语调\n4. 确保流畅自然\n\n原文：\n[在此处粘贴原文]"
      }
    ];
  }

  // 创建悬浮窗
  createFloatingWindow() {
    // 移除已存在的悬浮窗
    const existingWindow = document.getElementById('prompt-tool-floating-window');
    if (existingWindow) {
      existingWindow.remove();
    }

    // 创建悬浮窗容器
    this.floatingWindow = document.createElement('div');
    this.floatingWindow.id = 'prompt-tool-floating-window';
    this.floatingWindow.className = 'prompt-tool-window collapsed';
    
    // 设置初始位置 - 靠右边缘悬浮
    this.floatingWindow.style.position = 'fixed';
    this.floatingWindow.style.top = '50%';
    this.floatingWindow.style.right = '0px';
    this.floatingWindow.style.transform = 'translateY(-50%)';
    this.floatingWindow.style.zIndex = '10000';

    // 创建悬浮窗内容
    this.floatingWindow.innerHTML = `
      <div class="prompt-tool-header">
        <div class="prompt-tool-title">
          <span class="prompt-tool-icon">💡</span>
          <span class="prompt-tool-text">智能提示词</span>
        </div>
        <div class="prompt-tool-controls">
          <button class="prompt-tool-btn close-btn" title="关闭">×</button>
        </div>
      </div>
      <div class="prompt-tool-content">
        <div class="prompt-tool-search">
          <input type="text" id="prompt-search" placeholder="搜索提示词..." class="prompt-search-input">
        </div>
        <div class="prompt-tool-list" id="prompt-list">
          ${this.renderPromptList()}
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(this.floatingWindow);

    // 绑定事件
    this.bindEvents();
  }

  // 渲染提示词列表
  renderPromptList(prompts = this.prompts) {
    if (!prompts || prompts.length === 0) {
      return '<div class="no-prompts">暂无提示词</div>';
    }

    return prompts.map(prompt => `
      <div class="prompt-item" data-id="${prompt.id}">
        <div class="prompt-title">${prompt.title}</div>
        <div class="prompt-preview">${prompt.content.substring(0, 80)}...</div>
        <div class="prompt-actions">
          <button class="prompt-btn insert-btn" data-id="${prompt.id}">插入</button>
          <button class="prompt-btn copy-btn" data-id="${prompt.id}">复制</button>
        </div>
      </div>
    `).join('');
  }

  // 绑定事件
  bindEvents() {
    // 鼠标悬停功能
    this.bindHoverEvents();
    
    // 拖拽功能
    this.bindDragEvents();
    
    // 控制按钮
    this.bindControlEvents();
    
    // 搜索功能
    this.bindSearchEvents();
    
    // 提示词操作
    this.bindPromptEvents();
  }

  // 绑定鼠标悬停事件
  bindHoverEvents() {
    let hoverTimeout = null;
    
    // 鼠标进入悬浮窗
    this.floatingWindow.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.expandWindow();
    });
    
    // 鼠标离开悬浮窗
    this.floatingWindow.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.collapseWindow();
      }, 300); // 300ms延迟，避免快速移动时闪烁
    });
  }

  // 展开悬浮窗
  expandWindow() {
    this.floatingWindow.classList.remove('collapsed');
    this.floatingWindow.classList.add('expanded');
  }

  // 收缩悬浮窗
  collapseWindow() {
    this.floatingWindow.classList.remove('expanded');
    this.floatingWindow.classList.add('collapsed');
  }

  // 绑定拖拽事件
  bindDragEvents() {
    const header = this.floatingWindow.querySelector('.prompt-tool-header');
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('prompt-tool-btn')) return;
      
      this.isDragging = true;
      const rect = this.floatingWindow.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.handleDragEnd);
      
      e.preventDefault();
    });
  }

  // 处理拖拽
  handleDrag = (e) => {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // 限制在视窗内
    const maxX = window.innerWidth - this.floatingWindow.offsetWidth;
    const maxY = window.innerHeight - this.floatingWindow.offsetHeight;
    
    // 计算是否应该靠边缘悬浮
    const windowWidth = this.floatingWindow.offsetWidth;
    const windowHeight = this.floatingWindow.offsetHeight;
    
    // 判断是否靠近右边缘
    const isNearRightEdge = x > window.innerWidth - windowWidth - 50;
    // 判断是否靠近左边缘
    const isNearLeftEdge = x < 50;
    // 判断是否靠近顶部
    const isNearTopEdge = y < 50;
    // 判断是否靠近底部
    const isNearBottomEdge = y > window.innerHeight - windowHeight - 50;
    
    if (isNearRightEdge) {
      // 靠右边缘悬浮
      this.floatingWindow.style.right = '0px';
      this.floatingWindow.style.left = 'auto';
      this.floatingWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
      this.floatingWindow.style.transform = 'none';
    } else if (isNearLeftEdge) {
      // 靠左边缘悬浮
      this.floatingWindow.style.left = '0px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
      this.floatingWindow.style.transform = 'none';
    } else if (isNearTopEdge) {
      // 靠顶部悬浮
      this.floatingWindow.style.top = '0px';
      this.floatingWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.transform = 'none';
    } else if (isNearBottomEdge) {
      // 靠底部悬浮
      this.floatingWindow.style.top = 'auto';
      this.floatingWindow.style.bottom = '0px';
      this.floatingWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.transform = 'none';
    } else {
      // 自由拖拽
      this.floatingWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
      this.floatingWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.bottom = 'auto';
      this.floatingWindow.style.transform = 'none';
    }
  }

  // 结束拖拽
  handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    
    // 自动吸附到最近的边缘
    this.snapToEdge();
  }

  // 自动吸附到边缘
  snapToEdge() {
    const rect = this.floatingWindow.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const widgetWidth = rect.width;
    const widgetHeight = rect.height;
    
    const centerX = rect.left + widgetWidth / 2;
    const centerY = rect.top + widgetHeight / 2;
    
    // 计算到各边缘的距离
    const distanceToLeft = centerX;
    const distanceToRight = windowWidth - centerX;
    const distanceToTop = centerY;
    const distanceToBottom = windowHeight - centerY;
    
    // 找到最近的边缘
    const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
    
    if (minDistance === distanceToRight && distanceToRight < 100) {
      // 吸附到右边缘
      this.floatingWindow.style.right = '0px';
      this.floatingWindow.style.left = 'auto';
      this.floatingWindow.style.top = Math.max(0, Math.min(rect.top, windowHeight - widgetHeight)) + 'px';
      this.floatingWindow.style.bottom = 'auto';
      this.floatingWindow.style.transform = 'none';
    } else if (minDistance === distanceToLeft && distanceToLeft < 100) {
      // 吸附到左边缘
      this.floatingWindow.style.left = '0px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.top = Math.max(0, Math.min(rect.top, windowHeight - widgetHeight)) + 'px';
      this.floatingWindow.style.bottom = 'auto';
      this.floatingWindow.style.transform = 'none';
    } else if (minDistance === distanceToTop && distanceToTop < 100) {
      // 吸附到顶部
      this.floatingWindow.style.top = '0px';
      this.floatingWindow.style.bottom = 'auto';
      this.floatingWindow.style.left = Math.max(0, Math.min(rect.left, windowWidth - widgetWidth)) + 'px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.transform = 'none';
    } else if (minDistance === distanceToBottom && distanceToBottom < 100) {
      // 吸附到底部
      this.floatingWindow.style.bottom = '0px';
      this.floatingWindow.style.top = 'auto';
      this.floatingWindow.style.left = Math.max(0, Math.min(rect.left, windowWidth - widgetWidth)) + 'px';
      this.floatingWindow.style.right = 'auto';
      this.floatingWindow.style.transform = 'none';
    }
  }

  // 绑定控制事件
  bindControlEvents() {
    const closeBtn = this.floatingWindow.querySelector('.close-btn');
    
    closeBtn.addEventListener('click', () => {
      this.hideWindow();
    });
  }

  // 隐藏窗口
  hideWindow() {
    this.floatingWindow.style.display = 'none';
  }

  // 显示窗口
  showWindow() {
    this.floatingWindow.style.display = 'block';
  }

  // 绑定搜索事件
  bindSearchEvents() {
    const searchInput = this.floatingWindow.querySelector('#prompt-search');
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filteredPrompts = this.prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query)
      );
      
      const promptList = this.floatingWindow.querySelector('#prompt-list');
      promptList.innerHTML = this.renderPromptList(filteredPrompts);
      
      // 重新绑定提示词事件
      this.bindPromptEvents();
    });
  }

  // 绑定提示词事件
  bindPromptEvents() {
    const insertBtns = this.floatingWindow.querySelectorAll('.insert-btn');
    const copyBtns = this.floatingWindow.querySelectorAll('.copy-btn');
    
    insertBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const promptId = parseInt(e.target.dataset.id);
        this.insertPrompt(promptId);
      });
    });
    
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const promptId = parseInt(e.target.dataset.id);
        this.copyPrompt(promptId);
      });
    });
  }

  // 插入提示词
  insertPrompt(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    // 尝试多种方式查找输入框
    const inputElement = this.findInputElement();
    
    if (inputElement) {
      try {
        // 聚焦输入框
        inputElement.focus();
        
        // 等待一小段时间确保聚焦完成
        setTimeout(() => {
          this.insertTextToElement(inputElement, prompt.content);
          this.showNotification('提示词已插入！');
        }, 100);
      } catch (error) {
        console.error('插入提示词失败:', error);
        this.showNotification('插入失败，请手动复制', 'error');
      }
    } else {
      this.showNotification('未找到输入框，请确保页面已加载完成', 'error');
      // 提供手动检测选项
      this.showDebugInfo();
    }
  }

  // 智能查找输入框
  findInputElement() {
    // 优先使用手动选择的输入框
    if (this.selectedInputElement && this.isVisible(this.selectedInputElement)) {
      console.log('使用手动选择的输入框:', this.selectedInputElement);
      return this.selectedInputElement;
    }
    
    const selectors = this.getInputSelectors();
    
    console.log('正在查找输入框，当前平台:', this.currentPlatform);
    console.log('尝试的选择器:', selectors);
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      console.log(`选择器 "${selector}":`, element);
      if (element && this.isInputElement(element)) {
        console.log('找到输入框:', element);
        return element;
      }
    }
    
    // 如果都没找到，尝试查找所有可能的输入元素
    const allInputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
    console.log('所有可能的输入元素:', allInputs);
    
    for (const input of allInputs) {
      if (this.isInputElement(input) && this.isVisible(input)) {
        console.log('找到可见的输入元素:', input);
        return input;
      }
    }
    
    console.log('未找到任何输入框');
    return null;
  }

  // 获取所有可能的输入框选择器
  getInputSelectors() {
    switch (this.currentPlatform) {
      case 'chatgpt':
        return [
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Send a message"]',
          'textarea[data-id="root"]',
          '#prompt-textarea',
          '[data-testid="textbox"]',
          'div[contenteditable="true"]',
          'textarea',
          'input[type="text"]'
        ];
      case 'deepseek':
        return [
          'textarea[placeholder*="输入"]',
          'textarea[data-id="root"]',
          '.input-textarea',
          '[data-testid="textbox"]',
          'textarea',
          'input[type="text"]'
        ];
      default:
        return [
          'textarea',
          'input[type="text"]',
          'div[contenteditable="true"]'
        ];
    }
  }

  // 检查元素是否为输入框
  isInputElement(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isTextarea = tagName === 'textarea';
    const isInput = tagName === 'input' && element.type === 'text';
    const isContentEditable = element.contentEditable === 'true';
    
    return isTextarea || isInput || isContentEditable;
  }

  // 检查元素是否可见
  isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  // 向元素插入文本
  insertTextToElement(element, text) {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'textarea' || tagName === 'input') {
      // 处理普通输入框和文本域
      const currentValue = element.value || '';
      const newValue = currentValue + (currentValue ? '\n\n' : '') + text;
      
      element.value = newValue;
      
      // 触发各种事件
      this.triggerInputEvents(element);
    } else if (element.contentEditable === 'true') {
      // 处理可编辑div
      const currentText = element.textContent || element.innerText || '';
      const newText = currentText + (currentText ? '\n\n' : '') + text;
      
      element.textContent = newText;
      
      // 触发各种事件
      this.triggerInputEvents(element);
    }
    
    // 将光标移到末尾
    this.setCursorToEnd(element);
  }

  // 触发输入事件
  triggerInputEvents(element) {
    const events = ['input', 'change', 'keyup', 'blur'];
    
    events.forEach(eventType => {
      const event = new Event(eventType, { 
        bubbles: true, 
        cancelable: true 
      });
      element.dispatchEvent(event);
    });
  }

  // 将光标移到元素末尾
  setCursorToEnd(element) {
    if (element.setSelectionRange) {
      // 对于input和textarea
      const length = element.value ? element.value.length : 0;
      element.setSelectionRange(length, length);
    } else if (window.getSelection) {
      // 对于contenteditable元素
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // 复制提示词
  async copyPrompt(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      this.showNotification('提示词已复制到剪贴板！');
    } catch (error) {
      console.error('复制失败:', error);
      this.showNotification('复制失败，请手动复制', 'error');
    }
  }

  // 获取输入框选择器
  getInputSelector() {
    switch (this.currentPlatform) {
      case 'chatgpt':
        return 'textarea[placeholder*="Message"], textarea[placeholder*="Send a message"], #prompt-textarea, [data-testid="textbox"], textarea[data-id="root"], div[contenteditable="true"]';
      case 'deepseek':
        return 'textarea[placeholder*="输入"], .input-textarea, [data-testid="textbox"], textarea[data-id="root"]';
      default:
        return 'textarea, input[type="text"], div[contenteditable="true"]';
    }
  }

  // 显示通知
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `prompt-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 显示调试信息
  showDebugInfo() {
    const debugInfo = document.createElement('div');
    debugInfo.className = 'prompt-debug-info';
    debugInfo.innerHTML = `
      <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; margin: 10px; font-family: monospace; font-size: 12px;">
        <h4 style="margin: 0 0 10px 0; color: #495057;">🔍 输入框检测调试信息</h4>
        <p style="margin: 5px 0;"><strong>当前平台:</strong> ${this.currentPlatform}</p>
        <p style="margin: 5px 0;"><strong>页面URL:</strong> ${window.location.href}</p>
        <p style="margin: 5px 0;"><strong>检测到的输入元素:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          ${this.getDebugInputList()}
        </ul>
        <p style="margin: 10px 0 5px 0; color: #6c757d;">💡 请打开浏览器控制台查看详细日志</p>
        <div style="margin: 10px 0;">
          <button onclick="window.promptTool && window.promptTool.startManualInputSelection()" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-right: 8px;">手动选择输入框</button>
          <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">关闭</button>
        </div>
      </div>
    `;
    
    debugInfo.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10002;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(debugInfo);
    
    // 10秒后自动关闭
    setTimeout(() => {
      if (debugInfo.parentElement) {
        debugInfo.remove();
      }
    }, 10000);
  }

  // 获取调试输入列表
  getDebugInputList() {
    const allInputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
    let listHtml = '';
    
    allInputs.forEach((input, index) => {
      const tagName = input.tagName.toLowerCase();
      const placeholder = input.placeholder || input.getAttribute('placeholder') || '无';
      const isVisible = this.isVisible(input) ? '✅' : '❌';
      const selector = this.getElementSelector(input);
      
      listHtml += `<li style="margin: 2px 0;">
        ${index + 1}. ${tagName} - ${isVisible} 可见<br>
        <span style="color: #6c757d;">选择器: ${selector}</span><br>
        <span style="color: #6c757d;">占位符: ${placeholder}</span>
      </li>`;
    });
    
    return listHtml || '<li>未找到任何输入元素</li>';
  }

  // 获取元素的选择器
  getElementSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    const tagName = element.tagName.toLowerCase();
    const placeholder = element.placeholder || element.getAttribute('placeholder');
    
    if (placeholder) {
      return `${tagName}[placeholder*="${placeholder.substring(0, 10)}..."]`;
    }
    
    return tagName;
  }

  // 开始手动选择输入框
  startManualInputSelection() {
    this.showNotification('请点击要插入文本的输入框', 'info');
    
    // 添加点击事件监听器
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      if (this.isInputElement(element)) {
        this.selectedInputElement = element;
        this.showNotification('输入框已选择！现在可以插入提示词了', 'success');
        
        // 移除事件监听器
        document.removeEventListener('click', clickHandler, true);
        
        // 移除高亮样式
        this.removeInputHighlights();
        
        // 高亮选中的输入框
        this.highlightInputElement(element);
      } else {
        this.showNotification('请选择一个输入框（textarea、input或可编辑div）', 'error');
      }
    };
    
    // 添加事件监听器（使用捕获阶段）
    document.addEventListener('click', clickHandler, true);
    
    // 高亮所有可能的输入框
    this.highlightAllInputs();
    
    // 5秒后自动取消选择模式
    setTimeout(() => {
      document.removeEventListener('click', clickHandler, true);
      this.removeInputHighlights();
      this.showNotification('手动选择模式已取消', 'info');
    }, 10000);
  }

  // 高亮所有输入框
  highlightAllInputs() {
    const allInputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
    
    allInputs.forEach(input => {
      if (this.isVisible(input)) {
        input.style.outline = '2px solid #007bff';
        input.style.outlineOffset = '2px';
        input.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        input.setAttribute('data-prompt-highlight', 'true');
      }
    });
  }

  // 移除所有高亮
  removeInputHighlights() {
    const highlightedInputs = document.querySelectorAll('[data-prompt-highlight="true"]');
    
    highlightedInputs.forEach(input => {
      input.style.outline = '';
      input.style.outlineOffset = '';
      input.style.backgroundColor = '';
      input.removeAttribute('data-prompt-highlight');
    });
  }

  // 高亮选中的输入框
  highlightInputElement(element) {
    element.style.outline = '2px solid #28a745';
    element.style.outlineOffset = '2px';
    element.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
    element.setAttribute('data-prompt-selected', 'true');
  }

  // 监听页面变化
  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 检查是否有新的输入框出现
          const newInputs = Array.from(mutation.addedNodes).filter(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches && node.matches('textarea, input[type="text"]'))
          );
          
          if (newInputs.length > 0) {
            console.log('检测到新的输入框，重新初始化...');
            // 可以在这里添加重新初始化的逻辑
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 监听窗口大小变化
  bindWindowResize() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleWindowResize();
      }, 100);
    });
  }

  // 处理窗口大小变化
  handleWindowResize() {
    if (!this.floatingWindow) return;
    
    const rect = this.floatingWindow.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 检查悬浮窗是否超出窗口边界
    if (rect.right > windowWidth) {
      // 超出右边界，调整到右边缘
      this.floatingWindow.style.right = '0px';
      this.floatingWindow.style.left = 'auto';
    }
    
    if (rect.bottom > windowHeight) {
      // 超出下边界，调整到下边缘
      this.floatingWindow.style.bottom = '0px';
      this.floatingWindow.style.top = 'auto';
    }
    
    if (rect.left < 0) {
      // 超出左边界，调整到左边缘
      this.floatingWindow.style.left = '0px';
      this.floatingWindow.style.right = 'auto';
    }
    
    if (rect.top < 0) {
      // 超出上边界，调整到上边缘
      this.floatingWindow.style.top = '0px';
      this.floatingWindow.style.bottom = 'auto';
    }
  }
}

// 初始化插件
let promptTool = null;

// 等待页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    promptTool = new PromptTool();
    window.promptTool = promptTool; // 暴露到全局以便调试
  });
} else {
  promptTool = new PromptTool();
  window.promptTool = promptTool; // 暴露到全局以便调试
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleWindow') {
    if (promptTool) {
      if (promptTool.floatingWindow.style.display === 'none') {
        promptTool.showWindow();
      } else {
        promptTool.hideWindow();
      }
    }
    sendResponse({ success: true });
  }
});
