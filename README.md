# 基金公告运营助手

面向基金运营与客服人员的对话式 Demo：粘贴公告文字，输入运营问题，获取公告摘要、用户影响、客服话术与风险提示。支持题目规定的三个案例，并区分预置示例结果与 DeepSeek 实时生成结果。

**公网 Demo：** <https://fund-announcement-assistant.onrender.com/>（2026-10-18 已验证页面与实时 AI 接口）。

## 本地运行

```bash
python opendesign/mockups/fund-announcement-assistant/server.py
```

打开 <http://localhost:8290/opendesign/mockups/fund-announcement-assistant/>。不配置密钥时只能体验明确标注的示例模式；自定义公告和自由提问需要在服务端设置 `DEEPSEEK_API_KEY`。

## 交付材料

- [设计思路](交付材料/基金公告运营助手-设计思路.md)
- [提交说明与真实性披露](交付材料/提交说明.md)
- [实时 AI 验收记录](交付材料/实时AI验收记录.md)
- [三个案例截图](交付材料/screenshots/)
- [公网部署说明](DEPLOY.md)

密钥不得写入仓库或前端。根目录 `render.yaml` 提供 Render Web Service 部署配置；GitHub Pages 只能承载静态页面，不能运行本项目的 Python AI 后端。

