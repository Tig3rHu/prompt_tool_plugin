// 提示词管理器脚本
class PromptManager {
  constructor() {
    this.prompts = [];
    this.filteredPrompts = [];
    this.currentCategory = 'all';
    this.editingPrompt = null;
    
    this.init();
  }

  async init() {
    await this.loadPrompts();
    this.bindEvents();
    this.renderPrompts();
  }

  // 加载提示词数据
  async loadPrompts() {
    try {
      const result = await chrome.storage.sync.get(['prompts']);
      this.prompts = result.prompts || this.getDefaultPrompts();
      this.filteredPrompts = [...this.prompts];
    } catch (error) {
      console.error('加载提示词失败:', error);
      this.prompts = this.getDefaultPrompts();
      this.filteredPrompts = [...this.prompts];
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

  // 绑定事件
  bindEvents() {
    // 搜索功能
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchPrompts(e.target.value);
    });



    // 添加提示词
    document.getElementById('add-prompt').addEventListener('click', () => {
      this.openModal();
    });

    document.getElementById('add-first-prompt').addEventListener('click', () => {
      this.openModal();
    });

    // 导入导出
    document.getElementById('import-prompts').addEventListener('click', () => {
      this.importPrompts();
    });

    document.getElementById('export-prompts').addEventListener('click', () => {
      this.exportPrompts();
    });

    // 模态框事件
    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancel-prompt').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('prompt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePrompt();
    });

    // 点击模态框背景关闭
    document.getElementById('prompt-modal').addEventListener('click', (e) => {
      if (e.target.id === 'prompt-modal') {
        this.closeModal();
      }
    });
  }

  // 搜索提示词
  searchPrompts(query) {
    const searchTerm = query.toLowerCase();
    this.filteredPrompts = this.prompts.filter(prompt => {
      return prompt.title.toLowerCase().includes(searchTerm) ||
             prompt.content.toLowerCase().includes(searchTerm);
    });
    
    this.renderPrompts();
  }

  // 渲染提示词列表
  renderPrompts() {
    const grid = document.getElementById('prompts-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (this.filteredPrompts.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = this.filteredPrompts.map(prompt => this.renderPromptCard(prompt)).join('');
    
    // 绑定卡片事件
    this.bindCardEvents();
  }

  // 渲染单个提示词卡片
  renderPromptCard(prompt) {
    return `
      <div class="prompt-card" data-id="${prompt.id}">
        <div class="prompt-header">
          <div>
            <div class="prompt-title">${prompt.title}</div>
          </div>
          <div class="prompt-actions">
            <button class="action-btn edit-btn" data-id="${prompt.id}" title="编辑">
              ✏️
            </button>
            <button class="action-btn delete-btn" data-id="${prompt.id}" title="删除">
              🗑️
            </button>
          </div>
        </div>
        <div class="prompt-content">
          ${prompt.content}
        </div>
      </div>
    `;
  }

  // 绑定卡片事件
  bindCardEvents() {
    // 编辑按钮
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const promptId = parseInt(e.target.dataset.id);
        this.editPrompt(promptId);
      });
    });

    // 删除按钮
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const promptId = parseInt(e.target.dataset.id);
        this.deletePrompt(promptId);
      });
    });

    // 展开/收起内容
    document.querySelectorAll('.prompt-content').forEach(content => {
      content.addEventListener('click', () => {
        content.classList.toggle('expanded');
      });
    });
  }

  // 打开模态框
  openModal(prompt = null) {
    this.editingPrompt = prompt;
    const modal = document.getElementById('prompt-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('prompt-form');
    
    if (prompt) {
      title.textContent = '编辑提示词';
      document.getElementById('prompt-title').value = prompt.title;
      document.getElementById('prompt-content').value = prompt.content;
    } else {
      title.textContent = '添加提示词';
      form.reset();
    }
    
    modal.style.display = 'block';
    document.getElementById('prompt-title').focus();
  }

  // 关闭模态框
  closeModal() {
    document.getElementById('prompt-modal').style.display = 'none';
    this.editingPrompt = null;
  }

  // 保存提示词
  async savePrompt() {
    const title = document.getElementById('prompt-title').value.trim();
    const content = document.getElementById('prompt-content').value.trim();

    if (!title || !content) {
      alert('请填写标题和内容');
      return;
    }

    if (this.editingPrompt) {
      // 编辑现有提示词
      const index = this.prompts.findIndex(p => p.id === this.editingPrompt.id);
      if (index !== -1) {
        this.prompts[index] = {
          ...this.editingPrompt,
          title,
          content
        };
      }
    } else {
      // 添加新提示词
      const newId = Math.max(...this.prompts.map(p => p.id), 0) + 1;
      this.prompts.push({
        id: newId,
        title,
        content
      });
    }

    // 保存到存储
    await this.savePrompts();
    
    // 重新渲染
    this.filteredPrompts = [...this.prompts];
    this.renderPrompts();
    
    // 关闭模态框
    this.closeModal();
    
    this.showMessage('提示词已保存', 'success');
  }

  // 编辑提示词
  editPrompt(promptId) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (prompt) {
      this.openModal(prompt);
    }
  }

  // 删除提示词
  async deletePrompt(promptId) {
    if (!confirm('确定要删除这个提示词吗？')) {
      return;
    }

    this.prompts = this.prompts.filter(p => p.id !== promptId);
    await this.savePrompts();
    
    this.filteredPrompts = [...this.prompts];
    this.renderPrompts();
    
    this.showMessage('提示词已删除', 'success');
  }

  // 保存提示词到存储
  async savePrompts() {
    try {
      await chrome.storage.sync.set({ prompts: this.prompts });
    } catch (error) {
      console.error('保存提示词失败:', error);
      this.showMessage('保存失败', 'error');
    }
  }

  // 导入提示词
  importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedPrompts = JSON.parse(text);
        
        if (Array.isArray(importedPrompts)) {
          // 为导入的提示词分配新ID
          const maxId = Math.max(...this.prompts.map(p => p.id), 0);
          importedPrompts.forEach((prompt, index) => {
            prompt.id = maxId + index + 1;
          });
          
          this.prompts.push(...importedPrompts);
          await this.savePrompts();
          
          this.filteredPrompts = [...this.prompts];
          this.renderPrompts();
          
          this.showMessage(`成功导入 ${importedPrompts.length} 个提示词`, 'success');
        } else {
          throw new Error('文件格式不正确');
        }
      } catch (error) {
        console.error('导入失败:', error);
        this.showMessage('导入失败，请检查文件格式', 'error');
      }
    };
    
    input.click();
  }

  // 导出提示词
  exportPrompts() {
    const dataStr = JSON.stringify(this.prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    this.showMessage('提示词已导出', 'success');
  }

  // 显示消息
  showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

// 初始化管理器
document.addEventListener('DOMContentLoaded', () => {
  new PromptManager();
});
