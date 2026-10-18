# 基金公告运营助手 Demo

对话式网页 Demo：粘贴公告文字、输入运营问题、查看结构化分析与客服回复。左侧包含题目 A/B/C 三个示例。

## 运行

在项目根目录执行：

```powershell
python opendesign/mockups/fund-announcement-assistant/server.py
```

浏览器打开：

`http://localhost:8290/opendesign/mockups/fund-announcement-assistant/`

前端打包产物已包含在 `dist/app.js`。若修改 `src/assistant.jsx`，在本目录运行 `pnpm install`、`pnpm run build`。

## 启用实时 AI

完整密钥曾出现在聊天记录中，公网部署前应撤销旧密钥并新建一把。只在本机或部署平台的服务端环境变量中配置；不要再粘贴到聊天、前端、Git 仓库或交付 ZIP：

```powershell
$env:DEEPSEEK_API_KEY = "从控制台复制的完整密钥"
$env:DEEPSEEK_MODEL = "deepseek-chat"
python opendesign/mockups/fund-announcement-assistant/server.py
```

启动后界面右上角应显示“实时 AI 已配置”。操作流程为：粘贴至少 50 字的公告原文 → 保存公告 → 输入问题 → 分析。服务端调用 DeepSeek Chat Completions API，返回公告类型、摘要、用户影响、客服回复、App 文案、风险提示和依据。也保留 `AI_PROVIDER=openai` + `OPENAI_API_KEY` 的备选路径。配置 DeepSeek 密钥后，公告文本会发送给 DeepSeek API；请勿输入真实客户隐私数据。

公网部署时，只运行 `server.py` 对外提供页面及 API；在部署平台的 Secret/Environment Variables 中设置 `DEEPSEEK_API_KEY`，不要将 `.env` 上传到静态站点目录。平台需要监听全部网卡时设置 `FUND_DEMO_HOST=0.0.0.0`，并将流量转到 `FUND_DEMO_PORT`（默认 8290）。服务只公开四个前端静态文件及 API，不提供 `server.py`、`.env` 或项目目录下载。密钥不返回浏览器，但公开的分析接口仍可能被他人调用并消耗额度；正式公网演示建议同时开启平台访问保护和调用限额。不要只上传前端 `index.html`：那样无法安全调用模型。

仓库根目录提供 `render.yaml`，可用于从 GitHub 部署 Render Web Service。服务自动读取托管平台的 `PORT`，默认每小时限制 30 次 AI 调用；详细步骤见根目录 `DEPLOY.md`。

## 无密钥模式

- 三个示例的原题问题可查看预置结果，页面标明“示例答案”。
- 可粘贴并保存 50–30,000 字的公告文字；自定义公告分析与自由追问需要 API 密钥。
- 本版没有 PDF 上传或 OCR 功能。
- 基金与公告数据均为题目中的虚构材料，不连接真实业务系统。
- 已用临时配置的 DeepSeek 密钥实测三个规定案例，以及“输入文字公告 → 自定义问题 → 实时生成”的链路；原有案例截图仍为示例模式，须标为预置结果。验收记录见 `交付材料/实时AI验收记录.md`。

## 技术边界

公告文字仅保存在服务进程内存中，重启后需重新输入。分红金额和定投限额比较由程序计算；其余公告理解与客服文案在实时模式下由 AI 生成，并需人工复核。没有真实交易、登记查询、发布审批和原文高亮功能。
