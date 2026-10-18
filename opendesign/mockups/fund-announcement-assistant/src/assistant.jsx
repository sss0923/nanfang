import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const SAMPLE_CARDS = [
  { id: "A", title: "基金经理变更", detail: "离任原因与未来净值", glyph: "01" },
  { id: "B", title: "大额申购限制", detail: "2 万元定投是否受影响", glyph: "02" },
  { id: "C", title: "基金分红", detail: "750 元与分红方式确认", glyph: "03" }
];
const API = window.location.port === "8289" ? "http://localhost:8290" : "";

async function request(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `服务返回 HTTP ${response.status}`);
  return body;
}

function Icon({ name, size = 18 }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14"/>,
    send: <><path d="m4 19 16-7L4 5l3 7-3 7Z"/><path d="M7 12h13"/></>,
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 13h6M9 17h6"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    close: <path d="M6 6 18 18M18 6 6 18"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    alert: <><path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></>,
    spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function ResultCard({ entry, onCopy }) {
  const { result, mode, calculations, model, provider } = entry;
  return <section className="result-card">
    <div className="result-top">
      <div className="assistant-ident"><span className="assistant-mark"><Icon name="spark" size={17}/></span><div><strong>公告运营助手</strong><small>{mode === "live" ? `实时 AI · ${provider === "deepseek" ? "DeepSeek" : "OpenAI"} ${model}` : "题目案例 · 预置结果"}</small></div></div>
      <span className={`result-mode ${mode}`}>{mode === "live" ? "实时生成" : "示例答案"}</span>
    </div>
    <div className="result-body">
      <div className="result-lede">
        <span className="overline">公告类型</span><h2>{result.announcement_type}</h2>
      </div>
      <div className="result-grid">
        <section><span className="section-no">01 / 公告摘要</span><p>{result.summary}</p></section>
        <section><span className="section-no">02 / 用户影响</span><p>{result.impact}</p></section>
      </div>
      {calculations?.length > 0 && <div className="calc-note"><b>程序核算</b>{calculations.map((x, i)=><span key={i}>{x}</span>)}</div>}
      <div className="reply-block">
        <div className="block-heading"><span className="section-no">03 / 客服回复草稿</span><button onClick={()=>onCopy(result.service_reply)}><Icon name="copy" size={15}/>复制话术</button></div>
        <p>{result.service_reply}</p>
      </div>
      <div className="risk-block">
        <div className="block-heading"><span className="section-no">04 / 风险与待确认</span></div>
        <ul>{result.risk_notes.map((x, i)=><li key={i}>{x}</li>)}</ul>
      </div>
      <details className="evidence-details app-copy-details"><summary>App 运营文案草稿</summary><div className="app-copy-content"><p>{result.app_copy}</p><button onClick={()=>onCopy(result.app_copy)}><Icon name="copy" size={14}/>复制文案</button></div></details>
      {result.evidence?.length > 0 && <details className="evidence-details"><summary>查看结论依据 <span>{result.evidence.length} 项</span></summary><div>{result.evidence.map((x, i)=><p key={i}><b>{x.claim}</b><small>{x.source}</small></p>)}</div></details>}
    </div>
    <div className="result-foot">供基金运营人员复核 · 不直接对外发布</div>
  </section>;
}

function App() {
  const [status, setStatus] = useState({ loading: true, live_ai: false, error: "" });
  const [document, setDocument] = useState(null);
  const [sourceDraft, setSourceDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [working, setWorking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [toast, setToast] = useState("");
  const bottom = useRef(null);
  const taskVersion = useRef(0);

  useEffect(() => {
    request("/api/status").then(data => setStatus({ loading: false, ...data, error: "" }))
      .catch(() => setStatus({ loading: false, live_ai: false, error: "本地分析服务未启动。请按运行说明启动 server.py。" }));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, working]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const startNew = () => {
    taskVersion.current += 1;
    setDocument(null);
    setSourceDraft("");
    setEditing(false);
    setQuestion("");
    setMessages([]);
    setWorking(false);
    setSaving(false);
    setError("");
    setShowSource(false);
  };
  const loadSample = async (id) => {
    const version = ++taskVersion.current;
    setError("");
    setWorking(false);
    setSaving(false);
    try {
      const data = await request(`/api/sample/${id}`);
      if (version !== taskVersion.current) return;
      setDocument({ ...data, preview: data.source, characters: data.source.length, sampleQuestion: data.question });
      setSourceDraft("");
      setEditing(false);
      setQuestion(data.question);
      setMessages([]);
      setShowSource(false);
    } catch (err) { if (version === taskVersion.current) setError(err.message); }
  };
  const saveSource = async () => {
    const source = sourceDraft.trim();
    if (source.length < 50 || source.length > 30000 || saving) return;
    const version = ++taskVersion.current;
    setSaving(true); setError("");
    setWorking(false);
    try {
      const data = await request("/api/text", {
        method: "POST", body: JSON.stringify({ source })
      });
      if (version !== taskVersion.current) return;
      setDocument(data);
      setQuestion("");
      setMessages([]);
      setEditing(false);
      setShowSource(false);
      setToast("公告文字已保存，请输入运营问题");
    } catch (err) { if (version === taskVersion.current) setError(err.message); }
    finally { if (version === taskVersion.current) setSaving(false); }
  };
  const beginEdit = () => { if (working) return; setSourceDraft(document.preview); setEditing(true); setError(""); };
  const send = async () => {
    const text = question.trim();
    if (!document || !text || working || editing) return;
    const version = taskVersion.current;
    const history = messages.flatMap(m => m.kind === "user"
      ? [{ role: "user", text: m.text }]
      : m.kind === "result"
        ? [{ role: "assistant", text: m.data.result.impact }]
        : []);
    setMessages(m => [...m, { kind: "user", text }]);
    setQuestion("");
    setError("");
    setWorking(true);
    try {
      const data = await request("/api/analyze", {
        method: "POST", body: JSON.stringify({ document_id: document.id, question: text, history })
      });
      if (version === taskVersion.current) setMessages(m => [...m, { kind: "result", data }]);
    } catch (err) {
      if (version === taskVersion.current) setMessages(m => [...m, { kind: "error", text: err.message }]);
    } finally { if (version === taskVersion.current) setWorking(false); }
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); setToast("已复制内容"); }
    catch { setToast("复制失败，请手动选择文字"); }
  };
  const sampleMode = !status.live_ai;
  const sourceLength = sourceDraft.trim().length;
  const sourceValid = sourceLength >= 50 && sourceLength <= 30000;
  const canSend = !!document && !editing && !!question.trim() && !working && !status.error &&
    (status.live_ai || (document.mode === "sample" && question.trim() === document.sampleQuestion));

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-symbol">∷</span><div><b>公告运营助手</b><small>FUND OPS ASSISTANT</small></div></div>
      <button className="new-task" onClick={startNew}><Icon name="plus" size={17}/>新建分析</button>
      <div className="side-label">题目示例</div>
      <div className="sample-list">{SAMPLE_CARDS.map(card=><button key={card.id} className={document?.id === `sample:${card.id}` ? "active" : ""} onClick={()=>loadSample(card.id)}>
        <span className="sample-glyph">{card.glyph}</span><span><b>{card.title}</b><small>{card.detail}</small></span>
      </button>)}</div>
      <div className="side-bottom"><b>演示说明</b><p>粘贴公告文字即可提问。题目示例为虚构材料；启用实时 AI 后，公告文本会发送给模型 API。请勿输入客户隐私数据。</p></div>
    </aside>

    <main className="main-pane">
      <header className="app-header"><div><span className="header-title">基金公告运营助手</span><span className="header-separator">/</span><span className="header-context">{document?.title || "新建分析"}</span></div><span className={`mode-pill ${status.live_ai ? "live" : "sample"}`}>{status.loading ? "连接中" : status.error ? "服务未连接" : status.live_ai ? "实时 AI 已配置" : "示例模式 · 无 API 密钥"}</span></header>
      <div className="thread">
        {!document && <div className="welcome">
          <div className="welcome-mark"><Icon name="spark" size={26}/></div>
          <span className="eyebrow">FOR FUND OPERATIONS</span>
          <h1>把公告交给助手，<br/>把判断留给运营。</h1>
          <p>粘贴公告原文，再提出具体用户问题。助手会整理公告摘要、用户影响、客服话术与风险边界。</p>
          <div className="source-entry"><div className="source-entry-head"><label htmlFor="announcement-text">01 / 公告文字</label><span>{sourceLength.toLocaleString()} / 30,000 字</span></div><textarea id="announcement-text" value={sourceDraft} onChange={e=>setSourceDraft(e.target.value)} placeholder="在这里粘贴公告全文（至少 50 字），例如基金经理变更、限购或分红公告…" rows={8}/><div className="source-entry-actions"><small>仅输入公告事实，不要包含客户个人信息。</small><button className="primary-action" onClick={saveSource} disabled={!sourceValid || saving}>{saving ? "正在保存…" : "保存公告，继续提问"}<Icon name="arrow" size={15}/></button></div></div>
          <div className="flow-line"><span>01 粘贴公告</span><i/><span>02 输入问题</span><i/><span>03 获取材料</span></div>
        </div>}
        {document && <div className="conversation">
          <div className="document-note"><span className="file-badge"><Icon name="file" size={19}/></span><div><small>{document.mode === "sample" ? "题目示例已加载" : "公告文字已保存"}</small><b>{document.title}</b><span>{document.mode === "sample" ? "题目示例文字" : `${document.characters.toLocaleString()} 字`}</span></div><div className="document-actions"><button onClick={()=>setShowSource(true)}>查看原文</button><button onClick={beginEdit} disabled={working}>编辑公告 <Icon name="arrow" size={14}/></button></div></div>
          {editing && <div className="source-entry edit-entry"><div className="source-entry-head"><label htmlFor="edit-announcement">编辑公告文字</label><span>{sourceLength.toLocaleString()} / 30,000 字</span></div><textarea id="edit-announcement" value={sourceDraft} onChange={e=>setSourceDraft(e.target.value)} rows={10}/><div className="source-entry-actions"><small>保存后将清空旧分析结果，避免新旧公告混用。</small><div><button className="text-action" onClick={()=>setEditing(false)}>取消</button><button className="primary-action" onClick={saveSource} disabled={!sourceValid || saving}>{saving ? "正在保存…" : "保存修改"}</button></div></div></div>}
          {messages.length === 0 && !editing && <div className="ready-note"><span>下一步</span><h2>问一个具体的运营问题</h2><p>{document.mode === "sample" ? "下方已填入本案例的规定问题，点击“分析公告”查看结果。" : sampleMode ? "公告已保存。要分析自定义公告，请先配置实时 AI 密钥。" : "例如：这次公告对每月定投 2 万元的用户有什么影响？"}</p></div>}
          {messages.map((message, i) => message.kind === "user"
            ? <div className="user-message" key={i}><span>运营提问</span><p>{message.text}</p></div>
            : message.kind === "result"
              ? <ResultCard key={i} entry={message.data} onCopy={copy}/>
              : <div className="conversation-error" key={i}><Icon name="alert" size={17}/>{message.text}</div>)}
          {working && <div className="thinking"><span className="pulse-mark"><Icon name="spark" size={17}/></span><div><b>{sampleMode ? "正在读取示例结果" : "正在分析公告与用户影响"}</b><small>{sampleMode ? "此结果为预置案例答案" : "正在提取事实、校验计算并生成话术"}</small></div><span className="dots"><i/><i/><i/></span></div>}
          <div ref={bottom}/>
        </div>}
      </div>
      <div className="composer-wrap">
        {status.error && <div className="connection-error"><Icon name="alert" size={15}/>{status.error}</div>}
        {error && <div className="connection-error"><Icon name="alert" size={15}/>{error}<button onClick={()=>setError("")} aria-label="关闭提示"><Icon name="close" size={14}/></button></div>}
        <div className="composer">
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(canSend)send();}}} placeholder={document ? editing ? "先保存公告修改…" : "输入关于这份公告的运营问题，Enter 发送…" : "先粘贴公告文字或选择左侧示例…"} disabled={!document || working || editing} rows={2}/>
          <div className="composer-actions"><span>{!document ? "先保存公告文字" : editing ? "保存公告后再提问" : sampleMode ? document.mode === "sample" ? "示例模式仅支持原题问题" : "自定义公告需要实时 AI" : "仅根据当前公告作答"}</span><button className="send" onClick={send} disabled={!canSend}><Icon name="send" size={17}/>{working ? "分析中" : "分析公告"}</button></div>
        </div>
        <p className="composer-foot">结果仅供运营人员复核。公告未披露的事实会明确标为待确认。</p>
      </div>
    </main>
    {showSource && document && <div className="drawer-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowSource(false)}><aside className="source-drawer"><header><div><small>当前公告</small><h2>{document.title}</h2></div><button onClick={()=>setShowSource(false)} aria-label="关闭公告文本"><Icon name="close"/></button></header><p className="source-note">{document.mode === "sample" ? "以下为从题目材料整理的示例公告文字。" : "以下为你保存的公告文字，分析仅以这份内容为依据。"}</p><pre>{document.preview}</pre></aside></div>}
    {toast && <div className="toast"><Icon name="check" size={16}/>{toast}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
