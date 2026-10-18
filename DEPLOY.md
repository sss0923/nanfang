# 公网部署说明

本项目不是纯静态页面：浏览器调用同域名下的 `/api/text` 和 `/api/analyze`，Python 服务端再调用 DeepSeek。GitHub 用于存放代码；公网服务可用根目录的 `render.yaml` 创建 Render Web Service。仅开启 GitHub Pages 会缺少后端，无法分析自定义公告。

当前公网地址：<https://fund-announcement-assistant.onrender.com/>。2026-10-18 已验证主页、健康状态、三个规定案例和自定义文字公告的实时调用。若 Render 免费实例休眠，首次访问可能需要等待唤醒。

## 1. GitHub 仓库

目标仓库为 [sss0923/nanfang](https://github.com/sss0923/nanfang)。将本项目代码推送到该仓库。不要提交 `.env`、API 密钥或本地运行日志。仓库目前为公开仓库；Web Service 会另外提供 Demo 的公开访问地址。

## 2. 创建公网服务

在 Render 选择 New → Blueprint，关联上述 GitHub 仓库。根目录的 `render.yaml` 已配置 Python 服务、健康检查、监听地址与免费计划。创建时在 Secret 环境变量 `DEEPSEEK_API_KEY` 中填入**新生成**的完整密钥；不要使用曾发到聊天中的旧密钥。部署平台会提供一个 `https://...onrender.com` 公网地址。

服务默认限制每小时最多 30 次 AI 调用，可通过 `FUND_DEMO_AI_CALLS_PER_HOUR` 调整。这是单进程内的演示级保护，不代替平台侧访问控制、额度上限与监控。用于面试演示时，建议在 DeepSeek 控制台设置合理的消费上限，并避免输入真实客户隐私信息。

## 3. 验证

打开部署平台提供的 URL，应看到“实时 AI 已配置”。先加载案例 B，提问“每月定投 20,000 元是否受影响？”，结果应标记“实时生成”，并说明单日 10,000 元限额和恢复时间另行公告。再粘贴公告文字提出新问题，确认不是仅返回预置结果。

若未配置密钥，页面会显示“示例模式”，仅三个规定案例的原题问题能显示预置答案；这不算完成实时 AI 部署。更换或撤销密钥后，需更新 Render Secret 并重新部署/重启服务。

