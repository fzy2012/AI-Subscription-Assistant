# 💊 AI 后悔药 (AI Subscription Assistant)

> **让订阅不再是“单行道”。打破信息差，夺回消费者的“反悔权”。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%203.0%20Flash-blue)](https://deepmind.google/technologies/gemini/)

## 🌟 项目愿景 (Vision)

在 AI 工具爆发的今天，订阅容易退订难已成为常态。复杂的取消流程、隐蔽的扣费条款、无处可寻的客服入口……这些都在通过“信息不对等”来裹挟消费者。

**AI 后悔药** 是一个开源的智能辅助工具，旨在：
- ⚔️ **打破信息差**：揭露各大平台的真实退款政策与潜规则。
- 🛡️ **实现信息对等**：赋予普通用户与大平台对话的法律与商务语言能力。
- 🤝 **互助共建**：汇聚社区力量，整理最全的“避坑指南”与“退费攻略”。

**我们希望让每一次非自愿的扣费，都有“反悔”的机会。不用在订阅这件事情上走弯路，让话语权回归用户。**

## ✨ 核心功能 (Features)

- **🤖 AI 智能诊断**：基于 Google Gemini 3.0 模型，分析你的遭遇（误触、忘记取消、技术故障等），自动匹配最佳退费策略。
- **📝 律师级文书生成**：一键生成符合商务礼仪且引用消费者权益条款（如欧盟 14 天冷静期、Stripe 争议规则）的英文申诉邮件。
- **🔥 热门平台直通车**：针对 **Lovart**, **Midjourney**, **OpenAI**, **Apple** 等“重灾区”平台，提供定制化的“保姆级”退费指引与典型案例库。
- **📊 胜率预测**：基于社区大数据的退款成功率评估，不打无准备之仗。

## 🛠️ 技术栈 (Tech Stack)

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini API (gemini-3.0-flash)
- **Icons**: Lucide React

## 🤝 如何参与共建 (Contributing)

这是一个**开源共建**项目。一个人的力量是有限的，但我们汇聚在一起，就能构建最强大的消费者权益知识库。

我们非常欢迎你通过以下方式参与：

### 1. 提交退费案例 (Case Study)
如果你成功退款了某个软件，或者发现了新的退款渠道，请提交 Issue 分享你的经验：
- **平台名称**
- **退款原因**（如：忘记取消 / 误操作 / 无法使用）
- **成功关键点**（如：在邮件里强调了xx条款 / 找了xx支付渠道申诉）
- **相关截图/文案**（脱敏后）

### 2. 补充知识库 (Knowledge Base)
如果你熟悉代码，欢迎直接完善 `src/App.jsx` 中的 `KNOWLEDGE_BASE` 数据，添加新的平台支持：

```javascript
'new_platform': {
  name: 'New Platform Name',
  policy: '该平台的退款核心逻辑...',
  refundUrl: 'https://...',
  steps: [...]
}
```

### 3. 改进 AI 提示词 (Prompt Engineering)
帮助我们优化 AI 的生成逻辑，让申诉邮件更具说服力。

## 🚀 快速开始 (Getting Started)

1. **克隆项目**
   ```bash
   git clone https://github.com/fzy2012/AI-Subscription-Assistant.git
   cd AI-Subscription-Assistant
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   在项目根目录创建 `.env` 文件，并填入你的 Gemini API Key：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **启动项目**
   ```bash
   npm run dev
   ```

## ⚠️ 免责声明 (Disclaimer)

本项目提供的所有建议、文书模板及策略仅供参考，**不构成法律建议**。退款结果取决于各平台具体政策、您的实际使用情况以及沟通时机。在使用本工具时，请确保提供的信息真实有效。

---

**Together, let's reclaim our right to unsubscribe.**
**让我们一起，夺回退订的话语权。**
