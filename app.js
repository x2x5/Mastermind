"use strict";

const STORAGE_KEY = "prompt-card-layout-v2";
const PRIMARY_DATA_SOURCE_ZH = "./skills.md";
const PRIMARY_DATA_SOURCE_EN = "./skills-en.md";
const FALLBACK_DATA_SOURCE = "./README.md";
let currentPromptLang = "zh";

// Project last push time — update before each push
const LAST_MODIFIED = "2026-05-08 02:45:00 PM";

const AUTHOR_EMAIL = "x2x5.blog@outlook.com";

// ── UI i18n ──
const UI_STRINGS = {
  zh: {
    siteTitle: "杂交水论",
    cardManagement: "卡片管理",
    researchCanvas: "杂交水论",
    newCanvas: "新建画布",
    newLayout: "新布局",
    choosePlayMethod: "选择玩法",
    aiGenCanvas: "AI 布局",
    runPipeline: "一键运行",
    pause: "暂停",
    resume: "继续",
    formatCanvas: "格式化画布",
    undo: "撤销",
    redo: "重做",
    saveCanvas: "保存画布",
    loadCanvas: "加载画布",
    apiConfig: "API 配置",
    switchLang: "切换语言",
    promptZh: "提示词 中",
    promptEn: "EN",
    outputZh: "输出 中",
    outputEn: "EN",
    addCard: "新增卡片",
    metaTemplate: "元模板",
    needLabel: "需求",
    metaPlaceholder: "例如：把论文 Introduction 压缩成顶会风格 Abstract，300字内。",
    copyInput: "复制输入",
    aiGenerate: "AI 生成",
    promptPlaceholder: "粘贴 AI 返回内容：第一行写标题，后续写完整 skills 模板。",
    createCard: "创建卡片",
    cancel: "取消",
    apiConfigTitle: "API 配置",
    vendor: "供应商",
    apiUrl: "API 地址",
    model: "模型",
    saveSettings: "保存设置",
    close: "关闭",
    choosePlayTitle: "请选择你的玩法",
    genCanvasTitle: "AI 布局",
    genCanvasPlaceholder: "描述你想要的画布，例如：我想从多个不同领域的论文中各取一个模块，拼成一个新方法...",
    genCanvasBtn: "开始布局",
    canvasHasContent: "当前画布有内容",
    switchWarning: "切换玩法会清空当前画布，是否先保存？",
    saveAndContinue: "保存并继续",
    discardAndClear: "不保存直接清空",
    chooseSaveMethod: "选择保存方式：",
    saveToBrowser: "保存到浏览器",
    saveToFile: "保存到文件",
    exportMarkdown: "导出 Markdown",
    back: "返回",
    saveCanvasTitle: "保存画布",
    nameLabel: "名称",
    saveCanvasPlaceholder: "例如：杂交论文-方法迁移",
    save: "保存",
    loadCanvasTitle: "加载画布",
    editCard: "修改卡片",
    deleteCard: "删除卡片",
    viewTemplate: "查看模板",
    outputLabel: "输出",
    genOutput: "生成输出",
    copyOutput: "复制输出",
    copied: "已复制",
    copyFailed: "复制失败",
    titleLabel: "标题",
    templateContent: "模板内容",
    saveEdit: "保存修改",
    collapseExpand: "折叠/展开所有阶段",
    collapse: "折叠",
    expand: "展开",
    backToTop: "回到顶部",
    addStage: "+ 新增阶段",
    addCardBtn: "+ 卡片",
    deleteStage: "删除",
    restore: "恢复",
    emptyBench: "替补卡片暂无卡片",
    emptyCards: "暂无卡片",
    emptyTrash: "清空回收站",
    pleaseConfigApi: "请先在右上角 API 配置中填写 API Key",
    pleaseFillInput: "请先在输入区填写内容",
    cancelled: "已取消",
    genFailed: "生成失败：",
    copiedSuccess: "已复制",
    pleaseFillNeed: "请先填写需求",
    copiedMeta: "已复制元模板 + 需求",
    copyFailedManual: "复制失败，请手动复制",
    pleasePasteFull: "请粘贴完整内容：第一行标题，后续为 skills 模板",
    connectingAi: "正在连接 AI...",
    saved: "已保存",
    load: "加载",
    delete: "删除",
    pleaseEnterName: "请输入名称",
    canvasEmptyCannotSave: "画布为空，无法保存",
    invalidFormat: "文件格式无效",
    fileParseFailed: "文件解析失败",
    genCanvasPlease: "请先描述你想要的画布",
    genCanvasApi: "请先配置 API Key",
    genCanvasGenerating: "正在让 AI 布局...",
    genCanvasCancelled: "已取消",
    genCanvasFailed: "失败：",
    canvasEmptyAddCards: "画布为空，请先添加卡片",
    configApiKeyFirst: "请先配置 API Key",
    generating: "生成中",
    failed: "失败：",
    done: "完成",
    inputEmpty: "输入为空",
    selectLocalFile: "选择本地 skills.md",
    inputPlaceholder: "输入区：把要处理的内容贴在这里...",
    outputPlaceholder: "AI 输出结果...",
    subtitlePlaceholder: "点击添加备注…",
    subtitleInputPlaceholder: "输入备注…",
    uncategorized: "未分类",
    startNode: "起点",
    endNode: "终点",
    // Play method names
    pmCrossDomain: "A+B 跨域迁移",
    pmCrossDomainDesc: "从两篇跨领域论文中提取方法，交叉融合生成新 Idea",
    pmNewBenchmark: "新 Benchmark",
    pmNewBenchmarkDesc: "设计更真实的评测体系，不改模型改评价",
    pmWorkflow: "Workflow 设计",
    pmWorkflowDesc: "设计多步骤工作流，不换模型换流程",
    pmEfficiency: "Efficiency 优化",
    pmEfficiencyDesc: "不求最强，求更快、更便宜、更省",
    pmRobustness: "鲁棒性研究",
    pmRobustnessDesc: "让模型更安全、更抗攻击、更公平",
    pmTheory: "设计空间分析",
    pmTheoryDesc: "解释为什么有效，系统分析设计空间",
    pmSystem: "系统论文",
    pmSystemDesc: "端到端框架，多组件协同，工程可复用",
    pmDataset: "数据集构建",
    pmDatasetDesc: "构造大规模/高质量/新领域数据集",
    pmMetric: "评估指标设计",
    pmMetricDesc: "让「怎么判断好坏」更可靠",
    systemPlayMethods: "系统玩法",
    customPlayMethods: "我的玩法",
    morePlayMethods: "更多玩法",
    saveAsPlayMethod: "+ 保存当前画布为玩法",
    playMethodNamePrompt: "为这个玩法命名：",
    playMethodSaved: "玩法已保存",
    playMethodEmpty: "画布为空，无法保存为玩法",
    playMethodDeleteConfirm: "确定删除这个玩法吗？",
    customPlayMethodsCount: "{count} 个自定义玩法",
    noticeSkillsFallback: "当前未读取到 {source}，已回退到 README.md。建议把数据迁移到 skills.md。",
    noticeNoSkills: "浏览器没有直接读取到 {source}。你可以点击下面按钮手动选择本地 skills.md 文件。",
    noticeNoTemplates: "没有解析到可用模板，请检查 skills.md 的 Part I 和代码块格式。",
    noticeParseFailed: "解析 skills.md 失败，请确认文件内容完整后重试。",
    loadFromBrowser: "从浏览器加载",
    loadFromFile: "从文件加载",
    noSavedCanvases: "暂无保存的画布",
    nodesCount: "{count} 节点",
    genCanvasGeneratingStatus: "生成中... ({count} 字)",
    genCanvasDone: "已生成「{name}」，共 {count} 个步骤",
    bulbAnalyzing: "正在分析需求...",
    bulbGenerating: "正在生成布局...",
    bulbDrawing: "正在绘制画布...",
    genCanvasParseError: "无法解析 AI 返回的流程",
    genCanvasEmptyError: "AI 返回的流程为空",
    deleteStageTooltip: "删除阶段（移入回收站）",
    addCardTooltip: "新增卡片",
    trashWithCount: "回收站 ({count})",
    empty: "清空",
    noCardsInStage: "暂无卡片",
    configApiInPanel: "请先在新增卡片面板中配置 API",
    generatingSpinner: "生成中...",
    connecting: "正在连接...",
    generatingWithCount: "生成中... ({count} 字)",
    doneWithCount: "完成 ({count} 字)",
    stage1: "阶段 1：调研选题",
    stage2: "阶段 2：构思 Idea",
    stage3: "阶段 3：设计方法",
    stage4: "阶段 4：执行实验",
    stage5: "阶段 5：写论文",
    stage6: "阶段 6：审稿修改",
    stage7: "阶段 7：准备投稿",
    nodeApiSystemMsg: "你是一位专业的科研助手。根据用户提供的模板和输入内容，直接输出结果。不要加任何多余解释。",
    titleEmpty: "标题不能为空",
    rename: "改名",
    moveUp: "上移",
    moveDown: "下移",
    uiLangLabel: "界面语言",
    promptLangLabel: "提示词",
    outputLangLabel: "输出",
    updatedAt: "更新于 {time}",
    collapseAll: "全部折叠",
    expandAll: "全部展开",
    changelog: "更新日志",
    contactAuthor: "联系作者",
    about: "关于",
    emailCopied: "已复制作者邮箱",
    devMode: "开发者模式",
  },
  en: {
    siteTitle: "A+B Innovation",
    cardManagement: "Card Management",
    researchCanvas: "A+B Alchemy",
    newCanvas: "New Canvas",
    newLayout: "New Layout",
    choosePlayMethod: "Play Methods",
    aiGenCanvas: "AI Layout",
    runPipeline: "Run Pipeline",
    pause: "Pause",
    resume: "Resume",
    formatCanvas: "Format Canvas",
    undo: "Undo",
    redo: "Redo",
    saveCanvas: "Save Canvas",
    loadCanvas: "Load Canvas",
    apiConfig: "API Config",
    switchLang: "Switch Language",
    promptZh: "Prompt ZH",
    promptEn: "EN",
    outputZh: "Output ZH",
    outputEn: "EN",
    addCard: "Add Card",
    metaTemplate: "Meta Template",
    needLabel: "Requirement",
    metaPlaceholder: "e.g.: Compress a paper Introduction into a top-conference style Abstract, within 300 words.",
    copyInput: "Copy Input",
    aiGenerate: "AI Generate",
    promptPlaceholder: "Paste AI response: first line is title, rest is the full skills template.",
    createCard: "Create Card",
    cancel: "Cancel",
    apiConfigTitle: "API Configuration",
    vendor: "Vendor",
    apiUrl: "API URL",
    model: "Model",
    saveSettings: "Save Settings",
    close: "Close",
    choosePlayTitle: "Choose Your Play Method",
    genCanvasTitle: "AI Layout",
    genCanvasPlaceholder: "Describe the canvas you want, e.g.: I want to extract one module from papers in different fields and combine them into a new method...",
    genCanvasBtn: "Generate",
    canvasHasContent: "Canvas Has Content",
    switchWarning: "Switching play methods will clear the current canvas. Save first?",
    saveAndContinue: "Save & Continue",
    discardAndClear: "Discard & Clear",
    chooseSaveMethod: "Choose save method:",
    saveToBrowser: "Save to Browser",
    saveToFile: "Save to File",
    exportMarkdown: "Export Markdown",
    back: "Back",
    saveCanvasTitle: "Save Canvas",
    nameLabel: "Name",
    saveCanvasPlaceholder: "e.g.: Cross-domain Method Transfer",
    save: "Save",
    loadCanvasTitle: "Load Canvas",
    editCard: "Edit Card",
    deleteCard: "Delete Card",
    viewTemplate: "View Template",
    outputLabel: "Output",
    genOutput: "Generate",
    copyOutput: "Copy Output",
    copied: "Copied",
    copyFailed: "Failed",
    titleLabel: "Title",
    templateContent: "Template Content",
    saveEdit: "Save Changes",
    collapseExpand: "Collapse/Expand All Stages",
    collapse: "Collapse",
    expand: "Expand",
    backToTop: "Back to Top",
    addStage: "+ Add Stage",
    addCardBtn: "+ Card",
    deleteStage: "Delete",
    restore: "Restore",
    emptyBench: "No cards in bench",
    emptyCards: "No cards",
    emptyTrash: "Empty Trash",
    pleaseConfigApi: "Please configure API Key in the top-right API Config first",
    pleaseFillInput: "Please fill in the input area first",
    cancelled: "Cancelled",
    genFailed: "Generation failed: ",
    copiedSuccess: "Copied",
    pleaseFillNeed: "Please fill in the requirement",
    copiedMeta: "Meta template + requirement copied",
    copyFailedManual: "Copy failed, please copy manually",
    pleasePasteFull: "Please paste complete content: first line is title, followed by skills template",
    connectingAi: "Connecting to AI...",
    saved: "Saved",
    load: "Load",
    delete: "Delete",
    pleaseEnterName: "Please enter a name",
    canvasEmptyCannotSave: "Canvas is empty, cannot save",
    invalidFormat: "Invalid file format",
    fileParseFailed: "File parsing failed",
    genCanvasPlease: "Please describe the canvas you want first",
    genCanvasApi: "Please configure API Key first",
    genCanvasGenerating: "Generating canvas with AI...",
    genCanvasCancelled: "Cancelled",
    genCanvasFailed: "Failed: ",
    canvasEmptyAddCards: "Canvas is empty, please add cards first",
    configApiKeyFirst: "Please configure API Key first",
    generating: "Generating",
    failed: "Failed: ",
    done: "Done",
    inputEmpty: "Input empty",
    selectLocalFile: "Select local skills.md",
    inputPlaceholder: "Input: paste content to process here...",
    outputPlaceholder: "AI output...",
    subtitlePlaceholder: "Click to add note...",
    subtitleInputPlaceholder: "Enter note...",
    uncategorized: "Uncategorized",
    startNode: "Start",
    endNode: "End",
    // Play method names
    pmCrossDomain: "A+B Cross-Domain",
    pmCrossDomainDesc: "Extract methods from two cross-domain papers and fuse them into new ideas",
    pmNewBenchmark: "New Benchmark",
    pmNewBenchmarkDesc: "Design more realistic evaluation systems — improve evaluation, not the model",
    pmWorkflow: "Workflow Design",
    pmWorkflowDesc: "Design multi-step workflows — change the process, not the model",
    pmEfficiency: "Efficiency Optimization",
    pmEfficiencyDesc: "Not the strongest, but faster, cheaper, leaner",
    pmRobustness: "Robustness Research",
    pmRobustnessDesc: "Make models safer, more attack-resistant, and fairer",
    pmTheory: "Design Space Analysis",
    pmTheoryDesc: "Explain why things work, systematically analyze design space",
    pmSystem: "System Paper",
    pmSystemDesc: "End-to-end framework, multi-component coordination, engineering reusable",
    pmDataset: "Dataset Construction",
    pmDatasetDesc: "Build large-scale / high-quality / novel-domain datasets",
    pmMetric: "Evaluation Metric Design",
    pmMetricDesc: "Make \"how to judge quality\" more reliable",
    systemPlayMethods: "System Methods",
    customPlayMethods: "My Methods",
    morePlayMethods: "More Methods",
    saveAsPlayMethod: "+ Save Canvas as Method",
    playMethodNamePrompt: "Name this play method:",
    playMethodSaved: "Play method saved",
    playMethodEmpty: "Canvas is empty, cannot save as play method",
    playMethodDeleteConfirm: "Delete this play method?",
    customPlayMethodsCount: "{count} custom methods",
    noticeSkillsFallback: "Could not load {source}, fell back to README.md. Consider migrating data to skills.md.",
    noticeNoSkills: "Browser could not load {source}. Click the button below to manually select a local skills.md file.",
    noticeNoTemplates: "No usable templates found. Check skills.md Part I and code block format.",
    noticeParseFailed: "Failed to parse skills.md. Please verify the file content is complete.",
    loadFromBrowser: "Load from Browser",
    loadFromFile: "Load from File",
    noSavedCanvases: "No saved canvases",
    nodesCount: "{count} nodes",
    genCanvasGeneratingStatus: "Generating... ({count} chars)",
    genCanvasDone: "Generated「{name}」, {count} steps",
    bulbAnalyzing: "Analyzing...",
    bulbGenerating: "Generating layout...",
    bulbDrawing: "Drawing canvas...",
    genCanvasParseError: "Failed to parse AI response",
    genCanvasEmptyError: "AI returned empty workflow",
    deleteStageTooltip: "Delete stage (move to trash)",
    addCardTooltip: "Add card",
    trashWithCount: "Trash ({count})",
    empty: "Empty",
    noCardsInStage: "No cards",
    configApiInPanel: "Please configure API in the Add Card panel first",
    generatingSpinner: "Generating...",
    connecting: "Connecting...",
    generatingWithCount: "Generating... ({count} chars)",
    doneWithCount: "Done ({count} chars)",
    stage1: "Stage 1: Research Topics",
    stage2: "Stage 2: Conceive Ideas",
    stage3: "Stage 3: Design Methods",
    stage4: "Stage 4: Run Experiments",
    stage5: "Stage 5: Write Paper",
    stage6: "Stage 6: Review & Revise",
    stage7: "Stage 7: Prepare Submission",
    nodeApiSystemMsg: "You are a professional research assistant. Based on the template and input provided by the user, output the result directly. Do not add any extra explanation.",
    titleEmpty: "Title cannot be empty",
    rename: "Rename",
    moveUp: "Move Up",
    moveDown: "Move Down",
    uiLangLabel: "Interface",
    promptLangLabel: "Prompt",
    outputLangLabel: "Output",
    updatedAt: "Updated {time}",
    collapseAll: "Collapse All",
    expandAll: "Expand All",
    changelog: "Changelog",
    contactAuthor: "Contact Author",
    about: "About",
    emailCopied: "Author email copied",
    devMode: "Developer Mode",
  },
};

// Card title translations
const CARD_TITLE_MAP = {
  "文献检索策略": "Literature Search Strategy",
  "论文精读笔记": "Paper Deep Reading Notes",
  "领域图谱梳理": "Research Landscape Mapping",
  "失败场景设计": "Failure Scenario Design",
  "现有 Benchmark 分析": "Existing Benchmark Analysis",
  "研究 Idea 头脑风暴": "Research Idea Brainstorming",
  "可行性评估": "Feasibility Assessment",
  "创新点提炼": "Innovation Point Extraction",
  "方法迁移评估": "Method Transfer Assessment",
  "反向假设验证": "Reverse Hypothesis Verification",
  "任务定义": "Task Definition",
  "方法架构设计": "Method Architecture Design",
  "损失函数与优化策略": "Loss Function & Optimization Strategy",
  "概念图设计指引": "Conceptual Figure Design Guide",
  "数据构造 Pipeline": "Data Construction Pipeline",
  "对比学习设计": "Contrastive Learning Design",
  "Workflow 结构分析": "Workflow Structure Analysis",
  "多阶段系统设计": "Multi-Stage System Design",
  "人机协作设计": "Human-AI Collaboration Design",
  "实验方案设计": "Experiment Plan Design",
  "评估协议设计": "Evaluation Protocol Design",
  "数据质量评估": "Data Quality Assessment",
  "实验结果分析": "Experiment Result Analysis",
  "消融实验设计": "Ablation Study Design",
  "模型压缩策略": "Model Compression Strategy",
  "推理优化方案": "Inference Optimization Plan",
  "Method 章节撰写": "Method Section Writing",
  "Introduction 撰写": "Introduction Writing",
  "Abstract 撰写": "Abstract Writing",
  "Related Work 撰写": "Related Work Writing",
  "审稿意见回复": "Review Response Writing",
  "Cover Letter 撰写": "Cover Letter Writing",
  "Rebuttal 策略": "Rebuttal Strategy",
  "实验记录与复盘": "Experiment Log & Review",
};

function translateCardTitle(title) {
  if (uiLang === "en") {
    return CARD_TITLE_MAP[title] || title;
  }
  // If zh, reverse lookup
  for (const [zh, en] of Object.entries(CARD_TITLE_MAP)) {
    if (en === title) return zh;
  }
  return title;
}

let uiLang = localStorage.getItem("ui-lang") || "zh";
let outputLangGlobal = "zh";
function t(key) {
  return (UI_STRINGS[uiLang] && UI_STRINGS[uiLang][key]) || key;
}
function getOutputLang() {
  return outputLangGlobal;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-tooltip]").forEach((el) => {
    el.dataset.tooltip = t(el.dataset.i18nTooltip);
  });
  document.title = t("siteTitle");
}

const PART_ONE_HEADING = /^#\s+Part I:\s*.*$/;
const PART_TWO_HEADING = /^#\s+Part II:/;
const DEFAULT_COMMON_TITLES = [];
const META_TEMPLATE_TEXT_ZH = `# Role
你是一位世界顶级的 AI 提示词工程师（Prompt Engineer）。你的任务是根据我的【核心需求】，为我量身定制一套高标准、结构化的提示词模板，以便我能够用它来指导其他 AI 完美执行任务。

# Task
请分析我的需求，并严格按照下方的【目标模板结构】生成一份高质量的提示词。

# Target Template Structure (目标模板结构)
你输出的提示词必须包含以下四个部分，并且排版清晰：
1. # Role (角色设定)：为执行该任务的 AI 赋予一个最匹配、最资深的专家身份（例如：资深学术翻译官、顶级期刊编辑、高级数据分析师等）。
2. # Task (核心任务)：用一两句话清晰、无歧义地概括 AI 需要完成的动作。
3. # Constraints (约束与规则)：这是最核心的部分。请根据我的需求，帮我穷举并细化 AI 在执行任务时必须遵守的规则。可以包括但不限于：
   - 工作流（第一步做什么，第二步做什么）
   - 质量标准（语气风格、专业度要求）
   - 避坑指南（明确指出"不要做什么"，比如不要擅自增加信息、不要使用特定词汇等）
   - 输出格式（JSON、Markdown、纯文本、表格等）
4. # Input (输入区)：在末尾留出用括号包裹的占位符，例如 [在此处粘贴你的文本/数据/代码]，方便我后续填入真实内容。

# Constraints for You (对你的约束)
1. 专业度：生成的约束条件（Constraints）必须直击痛点。比如如果是学术写作任务，你要自动帮我加上"学术客观语气"、"避免使用过度口语化的副词"等专业规则。
2. 零废话：只输出生成好的提示词模板本身，不要加任何诸如"好的，我为您生成"之类的寒暄废话。
3. 语言：输出的提示词模板使用中文。
4. 输出格式补充：最终输出的第一行必须是标题（仅标题，不加解释），且必须为中文短标题，严格控制在 4-5 个字；从第二行开始输出完整 skills 模板正文。

# Input (我的核心需求)
[在这里填写你的具体需求，例如：我想把一篇论文的 Introduction 喂给 AI，让它帮我写出一篇不超过300字的 Abstract，要有逻辑感，符合计算机顶会的风格。]`;

const META_TEMPLATE_TEXT_EN = `# Role
You are a world-class AI Prompt Engineer. Your task is to create a high-standard, structured prompt template based on my [Core Requirement], so I can use it to guide other AI to perfectly execute tasks.

# Task
Analyze my requirement and generate a high-quality prompt strictly following the [Target Template Structure] below.

# Target Template Structure
Your output prompt must include the following four parts, formatted clearly:
1. # Role: Assign the most matching, senior expert identity to the AI executing this task (e.g., Senior Academic Translator, Top Journal Editor, Senior Data Analyst, etc.).
2. # Task: Clearly and unambiguously summarize the action AI needs to complete in one or two sentences.
3. # Constraints: This is the core part. Based on my requirement, exhaustively list and detail the rules AI must follow when executing the task. Include but not limited to:
   - Workflow (what to do first, what to do second)
   - Quality standards (tone, style, professionalism requirements)
   - Pitfall avoidance guide (clearly specify "what not to do", e.g., don't add information, don't use specific words, etc.)
   - Output format (JSON, Markdown, plain text, table, etc.)
4. # Input: Leave placeholders wrapped in brackets at the end, e.g., [Paste your text/data/code here], for me to fill in real content later.

# Constraints for You
1. Professionalism: Generated constraints must hit the pain point. For example, for academic writing tasks, automatically add professional rules like "academic objective tone", "avoid overly colloquial adverbs".
2. No fluff: Only output the generated prompt template itself, no chit-chat like "Sure, here's what I generated".
3. Language: Output the prompt template in English.
4. Output format note: The first line of the final output must be a title (title only, no explanation), a short English title of 4-8 words; from the second line onwards, output the complete skills template body.

# Input (My Core Requirement)
[Fill in your specific requirement here, e.g., I want to feed a paper's Introduction to AI and have it write an Abstract of no more than 300 words, with logical flow, in the style of top CS conferences.]`;

function getMetaTemplateText() {
  if (currentPromptLang === "en") {
    return META_TEMPLATE_TEXT_EN;
  }
  return META_TEMPLATE_TEXT_ZH;
}

const META_INPUT_PLACEHOLDER_ZH =
  "[在这里填写你的具体需求，例如：我想把一篇论文的 Introduction 喂给 AI，让它帮我写出一篇不超过300字的 Abstract，要有逻辑感，符合计算机顶会的风格。]";
const META_INPUT_PLACEHOLDER_EN =
  "[Fill in your specific requirement here, e.g., I want to feed a paper's Introduction to AI and have it write an Abstract of no more than 300 words, with logical flow, in the style of top CS conferences.]";

function getMetaInputPlaceholder() {
  if (currentPromptLang === "en") {
    return META_INPUT_PLACEHOLDER_EN;
  }
  return META_INPUT_PLACEHOLDER_ZH;
}

const commonRoot = document.getElementById("commonRoot");
const stagesRoot = document.getElementById("stagesRoot");
const customStagesRoot = document.getElementById("customStagesRoot");
const addStageBtn = document.getElementById("addStageBtn");
const cardCount = document.getElementById("cardCount");
const cardTemplate = document.getElementById("cardTemplate");

const layout2El = document.getElementById("layout2");
const newCanvasBtn = document.getElementById("newCanvasBtn");
const aiWandBtn = document.getElementById("aiWandBtn");
const layoutCanvasBtn = document.getElementById("layoutCanvasBtn");
const canvasNameEl = document.getElementById("canvasName");

const DEFAULT_USER_CARDS = [
  {
    title: "评估方法迁移",
    category: "用户卡片",
    prompt: `# Role
你是一位经验丰富的跨领域研究顾问，擅长评估一个方法从源领域迁移到目标领域的可行性和适配方案。

# Task
根据我提供的【源论文方法描述】和【我的研究问题/目标领域】，评估该方法迁移到我的场景中的可行性，分析需要做哪些适配，并给出具体的迁移建议。

# Constraints
1. 核心假设分析：
   - 源方法的核心假设是什么？（如数据分布、任务结构、评估方式等）
   - 这些假设在我的目标场景中是否成立？
   - 哪些假设可能不成立？不成立的话会带来什么问题？
2. 迁移可行性评估：
   - 技术层面：方法的哪些组件可以直接复用？哪些需要修改？哪些完全不适用？
   - 数据层面：源方法需要的数据条件和我的数据条件有什么差异？
   - 评估层面：源方法的评估指标在我的场景下是否合理？需要替换或补充什么指标？
3. 适配方案：
   - 给出具体的适配步骤（第一步做什么、第二步做什么）。
   - 每个步骤的技术选择和理由。
   - 可能需要引入的额外组件或技术。
4. 风险预警：
   - 迁移过程中最大的 2-3 个风险点。
   - 每个风险的应对策略。
   - 什么情况下应该放弃这个迁移方向？
5. 输出格式：
   - Part 1 [可行性评估]：假设分析 + 技术/数据/评估层面的可行性。
   - Part 2 [适配方案]：具体的迁移步骤和技术选择。
   - Part 3 [风险与建议]：风险预警 + 最终建议（推荐/谨慎/不推荐）。
   - 除以上三部分外，不要输出多余的对话。

# Input
[在此处粘贴源论文的方法描述（核心机制、关键公式、实验设置），以及你的研究问题和目标场景的简要描述]`,
  },
  {
    title: "记录实验日志",
    category: "用户卡片",
    prompt: `# Role
你是一位严谨的科研实验记录助手，擅长帮助研究者结构化地记录实验过程、结果和反思，确保实验可复现、思路可追溯。

# Task
根据我提供的【实验信息】，帮我生成一份结构化的实验日志条目，用于记录本次实验的完整信息。

# Constraints
1. 日志结构：
   - 实验编号与日期：自动编号，标注日期。
   - 实验目标：本次实验想验证什么？对应论文的哪个 claim？
   - 实验配置：模型配置、超参数、数据集版本、随机种子等所有可复现信息。
   - 实验结果：核心指标的具体数值，与上次实验的对比。
   - 观察与分析：结果是否符合预期？如果不符合，可能的原因是什么？
   - 下一步计划：基于本次结果，下一步要做什么？
2. 记录规范：
   - 所有数值必须具体，不要说"效果不错"，要说"准确率从 82.3% 提升到 85.1%"。
   - 超参数必须完整记录，不要遗漏任何可能影响复现的设置。
   - 如果有异常结果，必须详细记录当时的条件和可能的干扰因素。
3. 对比分析：
   - 如果我提供了历史实验数据，自动与最近的实验进行对比。
   - 标注哪些指标有提升，哪些有下降，变化幅度是多少。
4. 输出格式：
   - Part 1 [实验日志]：按上述结构输出完整日志。
   - Part 2 [关键发现]：用 1-2 句话总结本次实验最重要的发现。
   - Part 3 [下一步行动]：具体的下一步实验计划。
   - 除以上三部分外，不要输出多余的对话。

# Input
[在此处粘贴本次实验的配置、结果数据，以及你想验证的目标]`,
  },
  {
    title: "润色论文段落",
    category: "用户卡片",
    prompt: `# Role
你是一位以语言精准著称的学术论文编辑，专门为非母语英语作者提供论文润色服务，对计算机科学领域的学术写作惯例有深入理解。

# Task
对我提供的【论文段落】进行润色，在保持原意和作者风格的前提下，提升语言的精准度和专业度。

# Constraints
1. 润色原则：
   - 最小修改：只改确实有问题的地方，不要对已经通顺的句子进行"美化式重写"。
   - 保留原意：绝不改变作者要表达的意思，哪怕原句写得不够好。
   - 保留风格：不要改变作者的叙述节奏和个人风格。
   - 学术语体：使用正式学术英语，避免口语化表达。
2. 修改类型：
   - 语法修正：主谓一致、时态、冠词、介词等基础语法问题。
   - 用词优化：替换不准确或不地道的用词，使用更学术的表达。
   - 句式调整：改善句子结构，使逻辑更清晰、表达更紧凑。
   - 连接词优化：改善段落内部和段落之间的逻辑衔接。
3. 禁止事项：
   - 不要添加原段落中没有的信息。
   - 不要删除原段落中的关键信息。
   - 不要为了"听起来更高级"而替换词汇，只有在原词确实不准确时才替换。
   - 不要改变段落的论证逻辑。
4. 输出格式：
   - Part 1 [润色后英文]：润色后的完整段落。
   - Part 2 [修改清单]：逐条列出修改内容，格式为"原文 → 修改后 → 修改理由"。
   - Part 3 [中文对照]：润色后段落的中文直译，用于核对原意是否保留。
   - 除以上三部分外，不要输出多余的对话。

# Input
[在此处粘贴你需要润色的英文论文段落]`,
  },
];
const addModal = document.getElementById("addModal");
const addModalMask = document.getElementById("addModalMask");
const metaTemplateInput = document.getElementById("metaTemplateInput");
const metaNeedInput = document.getElementById("metaNeedInput");
const copyMetaBtn = document.getElementById("copyMetaBtn");
const metaStatusText = document.getElementById("metaStatusText");
const addPromptInput = document.getElementById("addPromptInput");
const createCardBtn = document.getElementById("createCardBtn");
const cancelAddBtn = document.getElementById("cancelAddBtn");
const addStatusText = document.getElementById("addStatusText");
const apiProviderSelect = document.getElementById("apiProviderSelect");
const apiEndpointInput = document.getElementById("apiEndpointInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiModelInput = document.getElementById("apiModelInput");
const apiSaveBtn = document.getElementById("apiSaveBtn");
const apiStatusText = document.getElementById("apiStatusText");
const aiGenerateBtn = document.getElementById("aiGenerateBtn");
const apiConfigModal = document.getElementById("apiConfigModal");
const apiConfigMask = document.getElementById("apiConfigMask");
const apiConfigBtn = document.getElementById("apiConfigBtn");
const notice = document.getElementById("notice");
const noticeText = document.getElementById("noticeText");
const manualFile = document.getElementById("manualFile");
const manualLoadBtn = document.querySelector(".manual-load-btn");

let baseItems = [];
let allItems = [];
let draggingId = null;
const inputStore = new Map();
let state = createDefaultState();
let pendingStageId = "";
let afterSaveCallback = null;

function openSaveModal() {
  const modal = document.getElementById("saveCanvasModal");
  const nameInput = document.getElementById("saveCanvasName");
  const status = document.getElementById("saveCanvasStatus");
  if (modal) modal.classList.remove("hidden");
  if (nameInput) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-`;
    nameInput.value = ts;
    nameInput.focus();
    nameInput.setSelectionRange(ts.length, ts.length);
  }
  if (status) status.textContent = "";
}

const STAGE_ORDER = [
  "阶段 1：调研选题",
  "阶段 2：构思 Idea",
  "阶段 3：设计方法",
  "阶段 4：执行实验",
  "阶段 5：写论文",
  "阶段 6：审稿修改",
  "阶段 7：准备投稿",
];

const API_CONFIG_KEY = "prompt-card-api-config";
const API_PROVIDERS = {
  deepseek: { name: "DeepSeek", endpoint: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-v4-flash", format: "openai" },
  openai: { name: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", format: "openai" },
  zhipu: { name: "智谱 (GLM)", endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions", model: "glm-4-flash", format: "openai" },
  moonshot: { name: "Moonshot (Kimi)", endpoint: "https://api.moonshot.cn/v1/chat/completions", model: "moonshot-v1-8k", format: "openai" },
  mimo: { name: "小米 MIMO", endpoint: "https://token-plan-cn.xiaomimimo.com/anthropic/v1/messages", model: "mimo-v2.5-pro", format: "anthropic" },
  anthropic: { name: "Anthropic (Claude)", endpoint: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514", format: "anthropic" },
  custom: { name: "自定义 (OpenAI)", endpoint: "", model: "", format: "openai" },
  "custom-anthropic": { name: "自定义 (Anthropic)", endpoint: "", model: "", format: "anthropic" },
};

function loadApiConfig() {
  let result;
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY);
    if (!raw) {
      const prov = API_PROVIDERS["deepseek"];
      result = { provider: "deepseek", endpoint: prov.endpoint, apiKey: "", model: prov.model };
    } else {
      const cfg = JSON.parse(raw);
      const provider = cfg.provider || "deepseek";
      const prov = API_PROVIDERS[provider];
      result = {
        provider,
        endpoint: cfg.endpoint || (prov ? prov.endpoint : ""),
        apiKey: cfg.apiKey || "",
        model: cfg.model || (prov ? prov.model : ""),
      };
    }
  } catch (_) {
    const prov = API_PROVIDERS["deepseek"];
    result = { provider: "deepseek", endpoint: prov.endpoint, apiKey: "", model: prov.model };
  }
  if (typeof window !== "undefined" && window.LOCAL_API_CONFIG && window.LOCAL_API_CONFIG.apiKey) {
    result.apiKey = window.LOCAL_API_CONFIG.apiKey;
  }
  return result;
}

function saveApiConfig(cfg) {
  try { localStorage.setItem(API_CONFIG_KEY, JSON.stringify(cfg)); } catch (_) {}
}

function getApiConfig() {
  const cfg = loadApiConfig();
  const prov = API_PROVIDERS[cfg.provider] || API_PROVIDERS.deepseek;
  return {
    endpoint: cfg.endpoint || prov.endpoint,
    apiKey: cfg.apiKey,
    model: cfg.model || prov.model,
    format: prov.format || "openai",
  };
}

init();
bindAddCardPanel();
bindApiConfig();
bindLayoutSwitch();
bindFloatingActions();

function bindFloatingActions() {
  const toggleBtn = document.getElementById("toggleCollapseBtn");
  const topBtn = document.getElementById("scrollTopBtn");

  if (toggleBtn) {
    let collapsed = false;
    toggleBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      toggleBtn.textContent = collapsed ? t("expand") : t("collapse");
      document.querySelectorAll(".layout1 details.zone").forEach((det) => {
        det.open = !collapsed;
      });
    });
  }

  if (topBtn) {
    topBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

async function init() {
  const markdown = await tryReadDataSource();
  if (!markdown) {
    // No data source, still init canvas
    state = normalizeState(loadState());
    refreshAllItems();
    // Update canvas name in UI
    if (canvasNameEl && state.canvasName) {
      canvasNameEl.textContent = state.canvasName;
    }
    switchToLayout2();
    return;
  }
  parseAndInit(markdown);
  switchToLayout2();
}

function getDataSource() {
  return currentPromptLang === "en" ? PRIMARY_DATA_SOURCE_EN : PRIMARY_DATA_SOURCE_ZH;
}

async function tryReadDataSource() {
  const source = getDataSource();
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("无法读取 " + source);
    }
    const text = await response.text();
    hideNotice();
    return text;
  } catch (error) {
    try {
      const fallbackResponse = await fetch(FALLBACK_DATA_SOURCE, { cache: "no-store" });
      if (!fallbackResponse.ok) {
        throw new Error("无法读取 fallback README.md");
      }
      const fallbackText = await fallbackResponse.text();
      showNotice(t("noticeSkillsFallback").replace("{source}", source));
      return fallbackText;
    } catch (fallbackError) {
      showNotice(t("noticeNoSkills").replace("{source}", source));
      manualLoadBtn.classList.remove("hidden");
      return null;
    }
  }
}

manualFile.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const text = await file.text();
  parseAndInit(text);
  // Refresh whichever layout is active
  switchToLayout2();
});


function parseAndInit(markdown) {
  try {
    hideNotice();

    baseItems = parsePromptItems(markdown).map((item) => ({
      ...item,
      source: "base",
    }));
    state = normalizeState(loadState());
    try { seedDefaultUserCards(); } catch (e) { console.error("seed error:", e); }
    refreshAllItems();
    saveState();

    // Update canvas name in UI
    if (canvasNameEl && state.canvasName) {
      canvasNameEl.textContent = state.canvasName;
    }

    if (allItems.length === 0) {
      showNotice(t("noticeNoTemplates"));
      manualLoadBtn.classList.remove("hidden");
    }
  } catch (error) {
    baseItems = [];
    allItems = [];
    state = createDefaultState();
    render();
    showNotice(t("noticeParseFailed"));
    manualLoadBtn.classList.remove("hidden");
  }
}

function parsePromptItems(markdown) {
  const partOne = extractPartOne(markdown);
  const sections = splitSections(partOne);

  return sections
    .map((section) => {
      const prompt = extractFenceBlocks(section.content).join("\n\n").trim();
      return {
        id: section.id,
        title: section.title,
        category: section.category || "未分类",
        prompt,
      };
    })
    .filter((item) => item.prompt.length > 0);
}

function extractPartOne(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inPartOne = false;
  const buffer = [];

  for (const line of lines) {
    if (!inPartOne) {
      if (PART_ONE_HEADING.test(line)) {
        inPartOne = true;
        buffer.push(line);
      }
      continue;
    }

    if (PART_TWO_HEADING.test(line)) {
      break;
    }
    buffer.push(line);
  }

  if (!inPartOne) {
    return markdown;
  }

  return buffer.join("\n");
}

function splitSections(partOneText) {
  const lines = partOneText.split(/\r?\n/);
  const sections = [];
  let current = null;
  let currentCategory = "未分类";
  let inFence = false;
  let fenceMarker = "";
  const usedIds = new Set();

  for (const line of lines) {
    const fenceMatch = line.match(/^(`{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker.length >= fenceMarker.length) {
        inFence = false;
        fenceMarker = "";
      }
      if (current) {
        current.content.push(line);
      }
      continue;
    }

    if (!inFence) {
      const categoryHeading = line.match(/^##\s+(.+?)\s*$/);
      if (categoryHeading) {
        currentCategory = cleanTitle(categoryHeading[1]) || "未分类";
        continue;
      }

      const heading = line.match(/^###\s+(.+?)\s*$/);
      if (heading) {
        if (current) {
          sections.push(current);
        }
        const title = cleanTitle(heading[1]);
        current = {
          id: buildStableId(title, usedIds),
          title,
          category: currentCategory,
          content: [],
        };
        continue;
      }
    }

    if (current) {
      current.content.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}

function extractFenceBlocks(lines) {
  const blocks = [];
  let inFence = false;
  let fenceMarker = "";
  let buffer = [];

  for (const line of lines) {
    const fenceMatch = line.match(/^(`{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        buffer = [];
      } else if (marker.length >= fenceMarker.length) {
        inFence = false;
        const block = buffer.join("\n").trim();
        if (block) {
          blocks.push(block);
        }
        fenceMarker = "";
        buffer = [];
      }
      continue;
    }

    if (inFence) {
      buffer.push(line);
    }
  }

  return blocks;
}

function cleanTitle(title) {
  return title
    .replace(/[💡🎯✨📖📑🤖📝🎉🔬🚀🤝]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildStableId(title, usedIds) {
  const base =
    title
      .toLowerCase()
      .replace(/[()（）]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "") || "card";

  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let index = 2;
  while (usedIds.has(`${base}-${index}`)) {
    index += 1;
  }
  const id = `${base}-${index}`;
  usedIds.add(id);
  return id;
}


function render(options = {}) {
  const suppressAnimation = Boolean(options.suppressAnimation);
  if (suppressAnimation) {
    document.body.classList.add("no-enter-anim");
  }

  renderStages(allItems);
  renderCustomStages();

  if (suppressAnimation) {
    requestAnimationFrame(() => {
      document.body.classList.remove("no-enter-anim");
    });
  }
}

function renderStages(stageItems) {
  if (!stagesRoot) return;
  stagesRoot.innerHTML = "";
  // Exclude items belonging to custom stages — they're rendered by renderCustomStages
  const customStageNames = new Set(state.customStages.map((s) => s.name));
  const grouped = new Map();
  stageItems.forEach((item) => {
    if (customStageNames.has(item.category)) return;
    const cat = item.category || t("uncategorized");
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat).push(item);
  });

  // Stage name translation map
  const stageI18nMap = {
    "阶段 1：调研选题": "stage1",
    "阶段 2：构思 Idea": "stage2",
    "阶段 3：设计方法": "stage3",
    "阶段 4：执行实验": "stage4",
    "阶段 5：写论文": "stage5",
    "阶段 6：审稿修改": "stage6",
    "阶段 7：准备投稿": "stage7",
  };

  const orderedCategories = [];
  STAGE_ORDER.forEach((cat) => {
    if (grouped.has(cat)) {
      orderedCategories.push(cat);
    }
  });
  grouped.forEach((_, cat) => {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  });

  orderedCategories.forEach((cat) => {
    const items = grouped.get(cat);
    if (!items || items.length === 0) {
      return;
    }
    const details = document.createElement("details");
    details.className = "zone stage-zone";
    details.open = true;

    const summary = document.createElement("summary");
    const span = document.createElement("span");
    // Translate stage name for display
    const i18nKey = stageI18nMap[cat];
    span.textContent = i18nKey ? t(i18nKey) : cat;

    const addBtn = document.createElement("button");
    addBtn.className = "stage-ctrl-btn";
    addBtn.textContent = "+ " + t("addCardBtn").replace("+ ", "");
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pendingStageId = "builtin:" + cat;
      addModal.classList.remove("hidden");
      metaNeedInput.focus();
    });

    summary.append(span, addBtn);
    details.appendChild(summary);

    const section = document.createElement("section");
    section.className = "cards";
    section.setAttribute("aria-label", cat + " 卡片列表");
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const card = createCard(item, "pool", index);
      fragment.appendChild(card);
    });
    section.appendChild(fragment);
    details.appendChild(section);

    stagesRoot.appendChild(details);
  });
}

function renderCustomStages() {
  if (!customStagesRoot) return;
  customStagesRoot.innerHTML = "";
  const sorted = [...state.customStages].sort((a, b) => a.order - b.order);

  sorted.forEach((stage) => {
    const cards = state.customCards.filter((c) => c.stageId === stage.id);
    const details = document.createElement("details");
    details.className = "zone stage-zone custom-stage-zone";
    details.open = true;
    details.dataset.stageId = stage.id;

    // Summary row
    const summary = document.createElement("summary");

    const nameWrap = document.createElement("span");
    nameWrap.className = "stage-name-wrap";

    const nameSpan = document.createElement("span");
    nameSpan.className = "stage-name-display";
    nameSpan.textContent = stage.name;

    const editIcon = document.createElement("button");
    editIcon.className = "stage-edit-icon";
    editIcon.type = "button";
    editIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 0 0 0-1.41l-1.5-1.5a1 1 0 0 0-1.41 0l-1.13 1.12 3.75 3.75 1.29-1.96z"/></svg>';
    editIcon.title = t("rename");
    editIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.className = "stage-name-input";
      input.value = stage.name;
      nameSpan.replaceWith(input);
      editIcon.style.display = "none";
      input.focus();
      input.select();
      const finish = (commit) => {
        const v = input.value.trim();
        if (commit && v && v !== stage.name) renameCustomStage(stage.id, v);
        else renderCustomStages();
      };
      input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") finish(true); if (ev.key === "Escape") finish(false); });
      input.addEventListener("blur", () => finish(true));
    });

    nameWrap.append(nameSpan, editIcon);

    const controls = document.createElement("div");
    controls.className = "stage-controls";

    const moveUp = document.createElement("button");
    moveUp.className = "stage-reorder-btn";
    moveUp.textContent = "↑";
    moveUp.title = t("moveUp");
    moveUp.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); reorderCustomStage(stage.id, "up"); });

    const moveDown = document.createElement("button");
    moveDown.className = "stage-reorder-btn";
    moveDown.textContent = "↓";
    moveDown.title = t("moveDown");
    moveDown.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); reorderCustomStage(stage.id, "down"); });

    const deleteStageBtn = document.createElement("button");
    deleteStageBtn.className = "stage-ctrl-btn danger";
    deleteStageBtn.textContent = t("deleteStage");
    deleteStageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteCustomStage(stage.id);
    });

    const addCardBtn = document.createElement("button");
    addCardBtn.className = "stage-ctrl-btn";
    addCardBtn.textContent = "+ " + t("addCardBtn").replace("+ ", "");
    addCardBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pendingStageId = stage.id;
      addModal.classList.remove("hidden");
      metaNeedInput.focus();
    });

    controls.append(moveUp, moveDown, deleteStageBtn, addCardBtn);
    summary.append(nameWrap, controls);
    details.appendChild(summary);

    // Cards
    const section = document.createElement("section");
    section.className = "cards";
    const fragment = document.createDocumentFragment();
    const items = cards.map((c) => ({ ...c, source: "custom" }));
    items.forEach((item, index) => fragment.appendChild(createCard(item, "pool", index)));
    section.appendChild(fragment);
    details.appendChild(section);

    customStagesRoot.appendChild(details);
  });

  // 回收站
  const trashCount = state.trashedStages.length + (state.trashedCards || []).length;
  if (trashCount > 0) {
    const trashDetails = document.createElement("details");
    trashDetails.className = "zone stage-zone trash-zone";
    trashDetails.open = false;

    const trashSummary = document.createElement("summary");
    const trashSpan = document.createElement("span");
    trashSpan.textContent = `回收站 (${trashCount})`;

    const emptyTrashBtn = document.createElement("button");
    emptyTrashBtn.className = "clear-trash-btn";
    emptyTrashBtn.textContent = t("emptyTrash");
    emptyTrashBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      emptyTrash();
    });

    trashSummary.append(trashSpan, emptyTrashBtn);
    trashDetails.appendChild(trashSummary);

    const trashSection = document.createElement("section");
    trashSection.className = "cards";
    state.trashedStages.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "trash-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "trash-item-name";
      nameSpan.textContent = "📁 " + entry.stage.name + (entry.cards.length > 0 ? ` (${entry.cards.length} 张卡片)` : "");

      const restoreBtn = document.createElement("button");
      restoreBtn.className = "stage-ctrl-btn";
      restoreBtn.textContent = t("restore");
      restoreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        restoreTrashedStage(index);
      });

      row.append(nameSpan, restoreBtn);
      trashSection.appendChild(row);
    });
    (state.trashedCards || []).forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "trash-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "trash-item-name";
      nameSpan.textContent = "🃏 " + entry.card.title;

      const restoreBtn = document.createElement("button");
      restoreBtn.className = "stage-ctrl-btn";
      restoreBtn.textContent = t("restore");
      restoreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        restoreTrashedCard(index);
      });

      row.append(nameSpan, restoreBtn);
      trashSection.appendChild(row);
    });
    trashDetails.appendChild(trashSection);
    customStagesRoot.appendChild(trashDetails);
  }
}

function renderList(root, items, zone) {
  root.innerHTML = "";
  const fragment = document.createDocumentFragment();

  if (zone === "common") {
    items.forEach((item, index) => {
      const card = createCard(item, zone, index);
      fragment.appendChild(card);
    });
    root.appendChild(fragment);
    return;
  }

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-tip";
    if (zone === "pool") {
      empty.textContent = t("emptyBench");
    } else {
      empty.textContent = t("emptyCards");
    }
    root.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const card = createCard(item, zone, index);
    fragment.appendChild(card);
  });
  root.appendChild(fragment);
}

function extractPlaceholder(prompt) {
  // Support both Chinese 【】 and English [] brackets
  const bracketsZh = prompt.match(/【([^】]+)】/g);
  const bracketsEn = prompt.match(/\[([^\]]+)\]/g);
  const brackets = bracketsZh || bracketsEn;
  if (brackets) {
    const items = brackets.map(b => b.slice(1, -1)).join(", ");
    return uiLang === "en" ? `Paste ${items}...` : `粘贴${items}...`;
  }
  return t("inputPlaceholder");
}

function createCard(item, zone, index) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  node.style.setProperty("--delay", `${Math.min(index * 40, 520)}ms`);
  node.dataset.cardId = item.id;
  node.dataset.zone = zone;
  if (item.source === "custom") node.classList.add("custom-card");

  const title = node.querySelector(".card-title");
  const input = node.querySelector(".card-input");
  const copyBtn = node.querySelector(".copy-btn");
  const aiGenBtn = node.querySelector(".ai-gen-btn");
  const outputWrap = node.querySelector(".card-output-wrap");
  const outputArea = node.querySelector(".card-output");
  const copyOutputBtn = node.querySelector(".copy-output-btn");
  const previewToggleBtn = node.querySelector(".preview-toggle-btn");
  const apiStatus = node.querySelector(".card-api-status");
  const editBtn = node.querySelector(".edit-btn");
  const deleteBtn = node.querySelector(".delete-btn");
  const status = node.querySelector(".copy-status");
  const preview = node.querySelector(".card-preview");
  const previewPre = preview ? preview.querySelector("pre") : null;

  const editPanel = node.querySelector(".edit-panel");
  const editTitleInput = node.querySelector(".edit-title");
  const editPromptInput = node.querySelector(".edit-prompt");
  const saveEditBtn = node.querySelector(".save-edit-btn");
  const cancelEditBtn = node.querySelector(".cancel-edit-btn");

  title.textContent = translateCardTitle(item.title);
  input.placeholder = extractPlaceholder(item.prompt);
  if (previewPre) previewPre.textContent = item.prompt;

  // Preview toggle
  if (previewToggleBtn && preview) {
    previewToggleBtn.addEventListener("click", () => {
      const isOpen = preview.classList.toggle("open");
      node.style.zIndex = isOpen ? 10 : "";
    });
  }
  input.value = inputStore.get(item.id) || "";

  const isCustomCard = item.source === "custom";
  if (isCustomCard) {
    editBtn.classList.remove("hidden");
    deleteBtn.classList.remove("hidden");
  } else {
    editBtn.classList.add("hidden");
    deleteBtn.classList.add("hidden");
  }

  input.addEventListener("input", () => {
    inputStore.set(item.id, input.value);
  });

  copyBtn.addEventListener("click", async () => {
    const content = mergePromptAndInput(item.prompt, input.value);
    try {
      await copyToClipboard(content);
      setStatus(status, "已复制到剪贴板", "success");
    } catch (error) {
      setStatus(status, "复制失败，请手动复制", "error");
    }
  });

  // AI generate
  let cardAbortController = null;
  aiGenBtn.addEventListener("click", async () => {
    const cfg = getApiConfig();
    if (!cfg.apiKey) {
      apiStatus.textContent = t("pleaseConfigApi");
      apiStatus.className = "card-api-status cnode-status error";
      return;
    }
    const userMsg = input.value.trim();
    if (!userMsg) {
      apiStatus.textContent = t("pleaseFillInput");
      apiStatus.className = "card-api-status cnode-status error";
      return;
    }
    outputWrap.classList.remove("hidden");
    outputArea.value = "";
    aiGenBtn.innerHTML = '<span class="spinner"></span>生成中...';
    aiGenBtn.disabled = true;
    apiStatus.textContent = "";
    cardAbortController = new AbortController();
    try {
      await callApi(cfg, item.prompt, userMsg, (text) => {
        outputArea.value += text;
      }, cardAbortController.signal);
      apiStatus.textContent = `生成完成 (${outputArea.value.length} 字)`;
      apiStatus.className = "card-api-status cnode-status success";
    } catch (err) {
      if (err.name === "AbortError") {
        apiStatus.textContent = t("cancelled");
      } else {
        apiStatus.textContent = t("genFailed") + (err.message || err);
      }
      apiStatus.className = "card-api-status cnode-status error";
    } finally {
      aiGenBtn.textContent = t("genOutput");
      aiGenBtn.disabled = false;
      cardAbortController = null;
    }
  });

  copyOutputBtn.addEventListener("click", async () => {
    try {
      await copyToClipboard(outputArea.value);
      copyOutputBtn.textContent = t("copied");
      setTimeout(() => { copyOutputBtn.textContent = t("copyOutput"); }, 1500);
    } catch {
      copyOutputBtn.textContent = t("copyFailed");
      setTimeout(() => { copyOutputBtn.textContent = t("copyOutput"); }, 1500);
    }
  });

  editBtn.addEventListener("click", () => {
    if (node.querySelector(".inline-title-edit")) return;
    const inlineInput = document.createElement("input");
    inlineInput.type = "text";
    inlineInput.className = "inline-title-edit";
    inlineInput.value = item.title;
    inlineInput.setAttribute("aria-label", "编辑标题");
    inlineInput.style.width = "100%";
    inlineInput.style.font = "inherit";
    inlineInput.style.padding = "4px 6px";
    inlineInput.style.borderRadius = "8px";
    inlineInput.style.border = "1px solid rgba(20, 34, 58, 0.24)";

    title.classList.add("hidden");
    title.parentNode.insertBefore(inlineInput, title);
    inlineInput.focus();
    inlineInput.select();

    const finish = (commit) => {
      const newTitle = inlineInput.value.trim();
      inlineInput.remove();
      title.classList.remove("hidden");
      if (!commit) return;
      if (!newTitle) { setStatus(status, t("titleEmpty"), "error"); return; }
      if (newTitle === item.title) return;
      updateCard(item.id, newTitle, item.prompt);
    };

    inlineInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); finish(true); }
      else if (event.key === "Escape") { event.preventDefault(); finish(false); }
    });
    inlineInput.addEventListener("blur", () => finish(true));
  });

  saveEditBtn.addEventListener("click", () => { editPanel.classList.add("hidden"); });
  cancelEditBtn.addEventListener("click", () => { editPanel.classList.add("hidden"); });

  deleteBtn.addEventListener("click", () => { deleteCard(item.id); });

  return node;
}

function bindAddCardPanel() {
  if (
    !addModal ||
    !addModalMask ||
    !metaTemplateInput ||
    !metaNeedInput ||
    !copyMetaBtn ||
    !metaStatusText ||
    !addPromptInput ||
    !createCardBtn ||
    !cancelAddBtn ||
    !addStatusText
  ) {
    return;
  }

  metaTemplateInput.value = getMetaTemplateText();

  if (addStageBtn) {
    addStageBtn.addEventListener("click", () => {
      addCustomStage("未命名");
    });
  }

  addModalMask.addEventListener("click", () => {
    closeAddPanel();
  });

  cancelAddBtn.addEventListener("click", () => {
    closeAddPanel();
  });

  copyMetaBtn.addEventListener("click", async () => {
    const need = metaNeedInput.value.trim();
    if (!need) {
      metaStatusText.textContent = t("pleaseFillNeed");
      metaStatusText.className = "meta-status error";
      metaNeedInput.focus();
      return;
    }
    const output = META_TEMPLATE_TEXT.replace(META_INPUT_PLACEHOLDER, need);
    try {
      await copyToClipboard(output);
      metaStatusText.textContent = t("copiedMeta");
      metaStatusText.className = "meta-status success";
    } catch (error) {
      metaStatusText.textContent = t("copyFailedManual");
      metaStatusText.className = "meta-status error";
    }
  });

  createCardBtn.addEventListener("click", () => {
    const parsed = parseGeneratedSkill(addPromptInput.value);
    if (!parsed) {
      addStatusText.textContent = t("pleasePasteFull");
      addStatusText.className = "add-status error";
      return;
    }
    addNewCard(parsed.title, parsed.prompt);
    closeAddPanel();
  });

  // AI generate button
  if (aiGenerateBtn) {
    aiGenerateBtn.addEventListener("click", () => {
      handleAiGenerate();
    });
  }
}

function closeAddPanel() {
  if (!addModal) {
    return;
  }
  addModal.classList.add("hidden");
  metaNeedInput.value = "";
  metaStatusText.textContent = "";
  metaStatusText.className = "meta-status";
  addPromptInput.value = "";
  addStatusText.textContent = "";
  addStatusText.className = "add-status";
  if (aiAbortController) { aiAbortController.abort(); aiAbortController = null; }
  if (aiGenerateBtn) { aiGenerateBtn.textContent = t("aiGenerate"); aiGenerateBtn.disabled = false; }
}

let aiAbortController = null;

function buildApiRequest(cfg, systemMsg, userMsg) {
  const isAnthropic = cfg.format === "anthropic";
  const headers = { "Content-Type": "application/json" };
  if (isAnthropic) {
    headers["x-api-key"] = cfg.apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${cfg.apiKey}`;
  }
  const body = isAnthropic
    ? { model: cfg.model, max_tokens: 8192, system: systemMsg, messages: [{ role: "user", content: userMsg }], stream: true }
    : { model: cfg.model, messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }], stream: true };
  return { headers, body };
}

function parseStreamChunk(format, line) {
  // Returns extracted text or null
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("data:")) return null;
  const data = trimmed.slice(5).trim();
  if (data === "[DONE]") return null;
  try {
    const json = JSON.parse(data);
    if (format === "anthropic") {
      // Anthropic SSE: event: content_block_delta, data: {"delta":{"text":"..."}}
      if (json.type === "content_block_delta" && json.delta && json.delta.text) return json.delta.text;
    } else {
      // OpenAI SSE: data: {"choices":[{"delta":{"content":"..."}}]}
      const delta = json.choices && json.choices[0] && json.choices[0].delta;
      if (delta && delta.content) return delta.content;
    }
  } catch (_) {}
  return null;
}

async function streamApiResponse(resp, format, onText) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const text = parseStreamChunk(format, line);
      if (text) onText(text);
    }
  }
}

async function callApi(cfg, systemMsg, userMsg, onText, signal) {
  const { headers, body } = buildApiRequest(cfg, systemMsg, userMsg);
  const abortSignal = signal || (aiAbortController ? aiAbortController.signal : undefined);
  const resp = await fetch(cfg.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: abortSignal,
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${errText.slice(0, 300)}`);
  }
  await streamApiResponse(resp, cfg.format, onText);
}

async function handleAiGenerate() {
  const need = metaNeedInput.value.trim();
  if (!need) {
    addStatusText.textContent = t("pleaseFillNeed");
    addStatusText.className = "add-status error";
    metaNeedInput.focus();
    return;
  }

  const cfg = getApiConfig();
  if (!cfg.apiKey) {
    addStatusText.textContent = t("pleaseConfigApi");
    addStatusText.className = "add-status error";
    return;
  }

  const systemMsg = "你是一位世界顶级的 AI 提示词工程师。根据用户的需求，生成高质量的 skills 模板。第一行输出中文短标题（4-5字），从第二行开始输出完整模板正文。";
  const userMsg = META_TEMPLATE_TEXT.replace(META_INPUT_PLACEHOLDER, need);

  if (aiAbortController) aiAbortController.abort();
  aiAbortController = new AbortController();

  aiGenerateBtn.innerHTML = '<span class="spinner"></span>生成中...';
  aiGenerateBtn.disabled = true;
  addPromptInput.value = "";
  addStatusText.textContent = t("connectingAi");
  addStatusText.className = "add-status";

  try {
    let fullText = "";
    let charCount = 0;
    await callApi(cfg, systemMsg, userMsg, (text) => {
      fullText += text;
      charCount += text.length;
      addPromptInput.value = fullText;
      addStatusText.textContent = `正在生成... (${charCount} 字)`;
      addStatusText.className = "add-status";
    });
    addStatusText.textContent = `生成完成 (${charCount} 字)，请检查后点击「创建卡片」`;
    addStatusText.className = "add-status success";
  } catch (err) {
    if (err.name === "AbortError") {
      addStatusText.textContent = t("cancelled");
      addStatusText.className = "add-status";
    } else {
      addStatusText.textContent = t("genFailed") + err.message;
      addStatusText.className = "add-status error";
    }
  } finally {
    aiGenerateBtn.textContent = t("aiGenerate");
    aiGenerateBtn.disabled = false;
    aiAbortController = null;
  }
}

function openApiConfig() {
  if (!apiConfigModal) return;
  apiConfigModal.classList.remove("hidden");
  const cfg = loadApiConfig();
  const prov = API_PROVIDERS[cfg.provider];
  apiProviderSelect.value = cfg.provider;
  apiKeyInput.value = cfg.apiKey;
  // Always show a value, never empty — fall back to provider defaults
  apiEndpointInput.value = cfg.endpoint || (prov ? prov.endpoint : "");
  apiModelInput.value = cfg.model || (prov ? prov.model : "");
}

function bindApiConfig() {
  if (!apiConfigModal) return;

  const apiConfigBtn1 = document.getElementById("apiConfigBtn1");

  if (apiConfigBtn) apiConfigBtn.addEventListener("click", openApiConfig);
  if (apiConfigBtn1) apiConfigBtn1.addEventListener("click", openApiConfig);

  if (apiConfigMask) {
    apiConfigMask.addEventListener("click", () => {
      apiConfigModal.classList.add("hidden");
    });
  }

  const apiConfigCloseX = document.getElementById("apiConfigCloseX");
  if (apiConfigCloseX) {
    apiConfigCloseX.addEventListener("click", () => {
      apiConfigModal.classList.add("hidden");
    });
  }

  if (apiProviderSelect) {
    apiProviderSelect.addEventListener("change", () => {
      const defaults = API_PROVIDERS[apiProviderSelect.value];
      if (defaults) {
        apiEndpointInput.value = defaults.endpoint;
        apiModelInput.value = defaults.model;
      }
    });
  }

  if (apiSaveBtn) {
    apiSaveBtn.addEventListener("click", () => {
      saveApiConfig({
        provider: apiProviderSelect.value,
        endpoint: apiEndpointInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
        model: apiModelInput.value.trim(),
      });
      apiConfigModal.classList.add("hidden");
    });
  }

  const apiTestBtn = document.getElementById("apiTestBtn");
  const apiTestStatus = document.getElementById("apiTestStatus");
  if (apiTestBtn) {
    apiTestBtn.addEventListener("click", async () => {
      const endpoint = apiEndpointInput.value.trim();
      const apiKey = apiKeyInput.value.trim();
      const model = apiModelInput.value.trim();
      if (!endpoint || !apiKey || !model) {
        apiTestStatus.textContent = "请填写完整配置";
        apiTestStatus.className = "meta-status error";
        return;
      }
      apiTestBtn.disabled = true;
      apiTestBtn.textContent = "测试中...";
      apiTestStatus.textContent = "";
      try {
        const prov = API_PROVIDERS[apiProviderSelect.value];
        const testCfg = {
          endpoint,
          apiKey,
          model,
          format: prov ? prov.format : "openai",
        };
        let response = "";
        await callApi(testCfg, "你是一个测试助手。", "嗨", (text) => { response += text; });
        apiTestStatus.textContent = "连接成功";
        apiTestStatus.className = "meta-status success";
      } catch (err) {
        apiTestStatus.textContent = "连接失败: " + err.message;
        apiTestStatus.className = "meta-status error";
      } finally {
        apiTestBtn.disabled = false;
        apiTestBtn.textContent = "测试连接";
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".topbar-dropdown").forEach((d) => d.classList.add("hidden"));
  });

  // Prevent dropdown content clicks from closing the dropdown
  document.querySelectorAll(".lang-dropdown, .settings-dropdown").forEach((dropdown) => {
    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  // Prevent dev mode toggle clicks from closing the dropdown
  const devModeToggleEl = document.getElementById("devModeToggle");
  if (devModeToggleEl) {
    devModeToggleEl.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // UI Language toggle
  function updateUiLang(newLang) {
    uiLang = newLang;
    localStorage.setItem("ui-lang", uiLang);
    applyStaticI18n();
    // Re-render canvas if available
    if (typeof CanvasApp !== "undefined") {
      CanvasApp.render();
    }
    // Sync both toggles
    document.querySelectorAll("#uiLangToggle .lang-toggle-btn, #uiLangToggle1 .lang-toggle-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === newLang);
    });
    // Update settings panel button texts
    const aboutBtn = document.getElementById("settingsAboutBtn");
    if (aboutBtn) {
      aboutBtn.textContent = t("about") + " " + t("siteTitle");
    }
    const contactBtn = document.getElementById("settingsContactBtn");
    if (contactBtn && contactBtn.textContent !== AUTHOR_EMAIL) {
      contactBtn.textContent = t("contactAuthor");
    }
    const devLabel = document.getElementById("devModeLabel");
    if (devLabel) {
      devLabel.textContent = t("devMode");
    }
  }

  document.querySelectorAll("#uiLangToggle .lang-toggle-btn, #uiLangToggle1 .lang-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateUiLang(btn.dataset.lang);
    });
  });

  // Prompt Language toggle
  async function updatePromptLang(newLang) {
    currentPromptLang = newLang;
    document.querySelectorAll("#promptLangToggle .lang-toggle-btn, #promptLangToggle1 .lang-toggle-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === newLang);
    });
    const markdown = await tryReadDataSource();
    if (markdown) {
      parseAndInit(markdown);
      // Update canvas with new template content
      if (typeof CanvasApp !== "undefined") {
        CanvasApp.setAllItems(allItems);
        CanvasApp.setTitleMap(CARD_TITLE_MAP);
        CanvasApp.render();
      }
    }
  }

  document.querySelectorAll("#promptLangToggle .lang-toggle-btn, #promptLangToggle1 .lang-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      updatePromptLang(btn.dataset.lang);
    });
  });

  // Output Language toggle
  function updateOutputLang(newLang) {
    outputLangGlobal = newLang;
    document.querySelectorAll("#outputLangToggle .lang-toggle-btn, #outputLangToggle1 .lang-toggle-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === newLang);
    });
  }

  document.querySelectorAll("#outputLangToggle .lang-toggle-btn, #outputLangToggle1 .lang-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateOutputLang(btn.dataset.lang);
    });
  });

  // Apply saved UI language on load
  const savedLang = localStorage.getItem("ui-lang") || "zh";
  if (savedLang === "en") updateUiLang("en");
  else applyStaticI18n();
}

function bindLayoutSwitch() {
  if (!layout2El) return;

  const backToCanvasBtn = document.getElementById("backToCanvasBtn");
  if (backToCanvasBtn) {
    backToCanvasBtn.addEventListener("click", () => {
      switchToLayout2();
    });
  }

  // New canvas button
  if (newCanvasBtn) {
    newCanvasBtn.addEventListener("click", () => {
      confirmCanvasSwitch((choice) => {
        if (choice === "cancel") return;
        CanvasApp.clear();
        state.canvasName = t("newLayout");
        if (canvasNameEl) canvasNameEl.textContent = t("newLayout");
        saveState();
      });
    });
  }

  // Canvas name editing
  if (canvasNameEl) {
    // Load saved name
    if (state.canvasName) {
      canvasNameEl.textContent = state.canvasName;
    }

    // Click to edit
    canvasNameEl.addEventListener("click", () => {
      canvasNameEl.contentEditable = "true";
      canvasNameEl.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(canvasNameEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // Save on blur or Enter
    canvasNameEl.addEventListener("blur", () => {
      canvasNameEl.contentEditable = "false";
      const name = canvasNameEl.textContent.trim() || t("newLayout");
      canvasNameEl.textContent = name;
      state.canvasName = name;
      saveState();
    });

    canvasNameEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        canvasNameEl.blur();
      }
    });
  }

  if (layoutCanvasBtn) {
    layoutCanvasBtn.addEventListener("click", () => {
      CanvasApp.autoLayout();
    });
  }

  // ── Pipeline Play ──
  const pipelinePlayBtn = document.getElementById("pipelinePlayBtn");
  let pipelineRunning = false;
  let pipelinePaused = false;
  let pipelineAbort = null;
  let pipelineResume = null;

  // Global: called by start node click on canvas
  function updatePlayBtnIcon() {
    if (!pipelinePlayBtn) return;
    const playIcon = pipelinePlayBtn.querySelector(".play-icon");
    const pauseIcon = pipelinePlayBtn.querySelector(".pause-icon");
    if (pipelineRunning) {
      if (playIcon) playIcon.style.display = "none";
      if (pauseIcon) pauseIcon.style.display = "";
    } else {
      if (playIcon) playIcon.style.display = "";
      if (pauseIcon) pauseIcon.style.display = "none";
    }
  }

  window.runPipelineFromStart = function() {
    if (pipelineRunning) return;
    runPipeline();
  };

  if (pipelinePlayBtn) {
    pipelinePlayBtn.addEventListener("click", () => {
      if (pipelineRunning) {
        if (pipelinePaused) {
          // Resume
          pipelinePaused = false;
          pipelinePlayBtn.classList.remove("paused");
          pipelinePlayBtn.classList.add("running");
          pipelinePlayBtn.dataset.tooltip = currentPromptLang === "en" ? "Pause" : "暂停";
          if (pipelineResume) pipelineResume();
        } else {
          // Pause
          pipelinePaused = true;
          pipelinePlayBtn.classList.remove("running");
          pipelinePlayBtn.classList.add("paused");
          pipelinePlayBtn.dataset.tooltip = currentPromptLang === "en" ? "Resume" : "继续";
        }
        return;
      }
      runPipeline();
    });
  }

  async function runPipeline() {
    const cfg = getApiConfig();
    if (!cfg.apiKey) {
      alert(currentPromptLang === "en" ? "Please configure API Key first" : "请先配置 API Key");
      return;
    }

    // Clear previous run states
    document.querySelectorAll(".cnode.running, .cnode.done, .cnode.error").forEach((el) => {
      el.classList.remove("running", "done", "error");
    });
    if (CanvasApp.clearEdgeClasses) CanvasApp.clearEdgeClasses();
    if (CanvasApp.dimBulb) CanvasApp.dimBulb();

    const canvasState = CanvasApp.getState();
    const canvasNodes = canvasState.nodes || [];
    const canvasEdges = canvasState.edges || [];

    if (canvasNodes.length === 0) {
      alert(t("canvasEmptyAddCards"));
      return;
    }

    // Build DAG: parent → children
    const childrenOf = new Map();
    const parentCount = new Map();
    canvasNodes.forEach((n) => { childrenOf.set(n.id, []); parentCount.set(n.id, 0); });
    canvasEdges.forEach((e) => {
      if (childrenOf.has(e.from) && parentCount.has(e.to)) {
        childrenOf.get(e.from).push(e.to);
        parentCount.set(e.to, parentCount.get(e.to) + 1);
      }
    });

    // Topological sort (Kahn's) to get execution order
    const queue = [];
    const execOrder = [];
    const layerOf = new Map();
    canvasNodes.forEach((n) => {
      if (parentCount.get(n.id) === 0) {
        queue.push(n.id);
        layerOf.set(n.id, 0);
      }
    });
    while (queue.length > 0) {
      const cur = queue.shift();
      execOrder.push(cur);
      const curLayer = layerOf.get(cur);
      for (const childId of (childrenOf.get(cur) || [])) {
        const newLayer = curLayer + 1;
        const prev = layerOf.get(childId);
        if (prev === undefined || newLayer > prev) layerOf.set(childId, newLayer);
        const remaining = parentCount.get(childId) - 1;
        parentCount.set(childId, remaining);
        if (remaining === 0) queue.push(childId);
      }
    }

    // Orphan nodes (no edges)
    canvasNodes.forEach((n) => {
      if (!execOrder.includes(n.id)) execOrder.push(n.id);
    });

    // Map node id → node object (from the actual nodes array, not the snapshot)
    const liveNodes = new Map();
    canvasNodes.forEach((sn => {
      const live = CanvasApp.getNodeById ? CanvasApp.getNodeById(sn.id) : null;
      liveNodes.set(sn.id, live || sn);
    }));

    // Start execution
    pipelineRunning = true;
    pipelinePaused = false;
    updatePlayBtnIcon();
    pipelineAbort = new AbortController();
    if (pipelinePlayBtn) {
      pipelinePlayBtn.classList.add("running");
      pipelinePlayBtn.dataset.tooltip = currentPromptLang === "en" ? "Pause" : "暂停";
    }
    if (CanvasApp.pulseBulb) CanvasApp.pulseBulb();

    const cardMap = new Map();
    allItems.forEach((card) => {
      if (!card) return;
      if (card.title) cardMap.set(card.title, card);
      if (card.id) cardMap.set(card.id, card);
    });

    const total = execOrder.length;
    let pipelineError = false;
    try {
      for (let step = 0; step < execOrder.length; step++) {
        const nodeId = execOrder[step];
        if (pipelineAbort.signal.aborted) break;

        // Wait while paused
        while (pipelinePaused && !pipelineAbort.signal.aborted) {
          await new Promise((r) => { pipelineResume = r; setTimeout(r, 200); });
        }
        if (pipelineAbort.signal.aborted) break;

        const node = liveNodes.get(nodeId);
        if (!node) continue;

        const card = cardMap.get(node.cardId);
        if (!card) continue;

        // Update progress
        const langLabel = (currentPromptLang === "en" ? "EN" : "中") + "/" + (outputLangGlobal === "en" ? "EN" : "中");
        const pauseLabel = currentPromptLang === "en" ? "Pause" : "暂停";
        if (pipelinePlayBtn) pipelinePlayBtn.dataset.tooltip = `${step + 1}/${total} · ${langLabel} · ${pauseLabel}`;

        // Highlight current card
        const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
          nodeEl.classList.add("running");
          nodeEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }

        // Animate incoming edges
        const incomingEdgeIds = canvasEdges.filter((e) => e.to === nodeId).map((e) => e.id);
        incomingEdgeIds.forEach((eid) => { if (CanvasApp.setEdgeClass) CanvasApp.setEdgeClass(eid, "running"); });

        // Collect input from parent outputs
        const parentEdges = canvasEdges.filter((e) => e.to === nodeId);
        let inputText = "";
        if (parentEdges.length > 0) {
          const parts = [];
          for (const pe of parentEdges) {
            const parentNode = liveNodes.get(pe.from);
            if (parentNode && parentNode.outputValue) {
              const parentCard = cardMap.get(parentNode.cardId);
              const parentTitle = parentCard ? parentCard.title : parentNode.cardId;
              const outputLabel = currentPromptLang === "en" ? `Output from [${parentTitle}]:\n` : `【${parentTitle}】的输出：\n`;
              parts.push(`${outputLabel}${parentNode.outputValue}`);
            }
          }
          if (parts.length > 0) inputText = parts.join("\n\n" + "─".repeat(30) + "\n\n");
        }

        // If card already has input, keep it; otherwise use parent output
        if (!node.inputValue && inputText) {
          node.inputValue = inputText;
          // Update textarea in DOM
          if (nodeEl) {
            const textarea = nodeEl.querySelector(".cnode-textarea:not(.cnode-output)");
            if (textarea) textarea.value = inputText;
          }
        }

        // Check if input is empty - stop pipeline
        const finalInput = node.inputValue || "";
        if (!finalInput.trim()) {
          const titleError = nodeEl ? nodeEl.querySelector(".cnode-title-error") : null;
          if (titleError) {
            titleError.textContent = currentPromptLang === "en" ? "Input empty, stopped" : "输入为空，停止运行";
            titleError.className = "cnode-title-error visible";
          }
          if (nodeEl) {
            nodeEl.classList.remove("running");
            nodeEl.classList.add("error");
          }
          incomingEdgeIds.forEach((eid) => { if (CanvasApp.setEdgeClass) CanvasApp.setEdgeClass(eid, "error"); });
          pipelineError = true;
          break;
        }

        // Build the prompt with language settings
        let systemMsg = card.prompt || (currentPromptLang === "en"
          ? `You are an expert in ${card.title}. Complete the task based on the input.`
          : `你是${card.title}领域的专家。请根据输入完成任务。`);
        if (currentPromptLang === "en") {
          systemMsg += "\n\nIMPORTANT: You MUST write your entire response (system prompt, reasoning, and output) in English. Do not use Chinese.";
        }
        if (outputLangGlobal === "en") {
          systemMsg += "\n\nIMPORTANT: Your final output must be written entirely in English.";
        } else if (outputLangGlobal === "zh") {
          systemMsg += "\n\n重要：你的最终输出必须完全使用中文书写。";
        }

        // Call AI API
        let fullOutput = "";
        const statusEl = nodeEl ? nodeEl.querySelector(".cnode-status") : null;
        if (statusEl) statusEl.textContent = currentPromptLang === "en"
          ? `Generating (${step + 1}/${total})...`
          : `AI 生成中 (${step + 1}/${total})...`;

        try {
          await callApi(cfg, systemMsg, finalInput, (text) => {
            fullOutput += text;
            // Update output textarea in real-time
            if (nodeEl) {
              const outputArea = nodeEl.querySelector(".cnode-output");
              if (outputArea) outputArea.value = fullOutput;
            }
          }, pipelineAbort.signal);
        } catch (cardErr) {
          if (cardErr.name === "AbortError") throw cardErr;
          if (statusEl) statusEl.textContent = t("failed") + cardErr.message;
          if (nodeEl) {
            nodeEl.classList.remove("running");
            nodeEl.classList.add("error");
          }
          throw cardErr;
        }

        // Save output to node
        node.outputValue = fullOutput;
        CanvasApp.updateNodeOutput(nodeId, fullOutput);

        if (statusEl) statusEl.textContent = t("done");

        // Mark done
        if (nodeEl) {
          nodeEl.classList.remove("running");
          nodeEl.classList.add("done");
        }

        // Mark incoming edges as done
        incomingEdgeIds.forEach((eid) => { if (CanvasApp.setEdgeClass) CanvasApp.setEdgeClass(eid, "done"); });
      }
    } catch (err) {
      pipelineError = true;
      if (err.name !== "AbortError") {
        console.error("Pipeline error:", err);
      }
    } finally {
      // Fill cup only on success (no abort, no error)
      if (!pipelineError && !pipelineAbort?.signal.aborted) {
        if (CanvasApp.lightBulb) CanvasApp.lightBulb();
      }
      // Clean up
      document.querySelectorAll(".cnode.running").forEach((el) => el.classList.remove("running"));
      pipelineRunning = false;
      pipelinePaused = false;
      updatePlayBtnIcon();
      pipelineAbort = null;
      pipelineResume = null;
      if (pipelinePlayBtn) {
        pipelinePlayBtn.classList.remove("running", "paused");
        pipelinePlayBtn.dataset.tooltip = currentPromptLang === "en" ? "Run Pipeline" : "一键运行";
      }
    }
  }

  // ── Save / Load Canvas ──
  const SAVED_CANVASES_KEY = "prompt-card-saved-canvases";
  const saveCanvasBtn = document.getElementById("saveCanvasBtn");
  const loadCanvasBtn = document.getElementById("loadCanvasBtn");
  const saveCanvasModal = document.getElementById("saveCanvasModal");
  const saveCanvasMask = document.getElementById("saveCanvasMask");
  const saveCanvasName = document.getElementById("saveCanvasName");
  const saveCanvasConfirmBtn = document.getElementById("saveCanvasConfirmBtn");
  const saveCanvasCancelBtn = document.getElementById("saveCanvasCancelBtn");
  const saveCanvasStatus = document.getElementById("saveCanvasStatus");
  const loadCanvasModal = document.getElementById("loadCanvasModal");
  const loadCanvasMask = document.getElementById("loadCanvasMask");
  const loadCanvasCloseBtn = document.getElementById("loadCanvasCloseBtn");
  const savedCanvasList = document.getElementById("savedCanvasList");

  function getSavedCanvases() {
    try {
      const raw = localStorage.getItem(SAVED_CANVASES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveCanvases(list) {
    try {
      localStorage.setItem(SAVED_CANVASES_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function openSaveModal() {
    if (saveCanvasModal) saveCanvasModal.classList.remove("hidden");
    if (saveCanvasName) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-`;
      saveCanvasName.value = ts;
      saveCanvasName.focus();
      // Place cursor right after the dash
      saveCanvasName.setSelectionRange(ts.length, ts.length);
    }
    if (saveCanvasStatus) saveCanvasStatus.textContent = "";
  }
  function closeSaveModal() {
    if (saveCanvasModal) saveCanvasModal.classList.add("hidden");
  }

  function openLoadModal() {
    if (loadCanvasModal) loadCanvasModal.classList.remove("hidden");
    renderSavedList();
  }
  function closeLoadModal() {
    if (loadCanvasModal) loadCanvasModal.classList.add("hidden");
  }

  function renderSavedList() {
    if (!savedCanvasList) return;
    const list = getSavedCanvases();
    if (list.length === 0) {
      savedCanvasList.innerHTML = `<div class="saved-canvas-empty">${t("noSavedCanvases")}</div>`;
      return;
    }
    savedCanvasList.innerHTML = "";
    list.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "saved-canvas-item";
      const name = document.createElement("span");
      name.className = "saved-canvas-name";
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "saved-canvas-meta";
      const nodeCount = item.state ? (item.state.nodes || []).length : 0;
      meta.textContent = t("nodesCount").replace("{count}", nodeCount);
      const actions = document.createElement("div");
      actions.className = "saved-canvas-actions";
      const loadBtn = document.createElement("button");
      loadBtn.className = "saved-canvas-load-btn";
      loadBtn.type = "button";
      loadBtn.textContent = t("load");
      loadBtn.addEventListener("click", () => {
        CanvasApp.loadState(item.state);
        closeLoadModal();
      });
      const delBtn = document.createElement("button");
      delBtn.className = "saved-canvas-del-btn";
      delBtn.type = "button";
      delBtn.textContent = t("delete");
      delBtn.addEventListener("click", () => {
        const updated = getSavedCanvases().filter((_, i) => i !== idx);
        saveCanvases(updated);
        renderSavedList();
      });
      actions.append(loadBtn, delBtn);
      row.append(name, meta, actions);
      savedCanvasList.appendChild(row);
    });
  }

  if (saveCanvasName) {
    saveCanvasName.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); saveCanvasConfirmBtn.click(); }
      if (e.key === "Escape") { closeSaveModal(); }
    });
  }

  if (saveCanvasMask) saveCanvasMask.addEventListener("click", closeSaveModal);
  if (saveCanvasCancelBtn) saveCanvasCancelBtn.addEventListener("click", closeSaveModal);
  if (saveCanvasConfirmBtn) {
    saveCanvasConfirmBtn.addEventListener("click", () => {
      const name = (saveCanvasName.value || "").trim();
      if (!name) {
        saveCanvasStatus.textContent = t("pleaseEnterName");
        saveCanvasStatus.className = "add-status error";
        return;
      }
      const state = CanvasApp.getState();
      if (!state.nodes || state.nodes.length === 0) {
        saveCanvasStatus.textContent = t("canvasEmptyCannotSave");
        saveCanvasStatus.className = "add-status error";
        return;
      }
      const list = getSavedCanvases();
      list.push({ name, state, savedAt: Date.now() });
      saveCanvases(list);
      saveCanvasStatus.textContent = t("saved");
      saveCanvasStatus.className = "add-status success";
      setTimeout(() => {
        closeSaveModal();
        if (afterSaveCallback) {
          const cb = afterSaveCallback;
          afterSaveCallback = null;
          cb();
        }
      }, 800);
    });
  }

  if (loadCanvasMask) loadCanvasMask.addEventListener("click", closeLoadModal);
  if (loadCanvasCloseBtn) loadCanvasCloseBtn.addEventListener("click", closeLoadModal);

  // Close modals on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (saveCanvasModal && !saveCanvasModal.classList.contains("hidden")) closeSaveModal();
      if (loadCanvasModal && !loadCanvasModal.classList.contains("hidden")) closeLoadModal();
      if (playMethodModal && !playMethodModal.classList.contains("hidden")) closePlayMethodModal();
      const switchModal = document.getElementById("canvasSwitchModal");
      if (switchModal && !switchModal.classList.contains("hidden")) switchModal.classList.add("hidden");
      closeAllDropdowns();
    }
  });

  // ── Save / Load Dropdowns ──
  const saveDropdown = document.getElementById("saveDropdown");
  const loadDropdown = document.getElementById("loadDropdown");
  const saveToBrowser = document.getElementById("saveToBrowser");
  const saveToFile = document.getElementById("saveToFile");
  const exportMarkdownBtn = document.getElementById("exportMarkdown");
  const loadFromBrowser = document.getElementById("loadFromBrowser");
  const loadFromFile = document.getElementById("loadFromFile");
  const importCanvasFile = document.getElementById("importCanvasFile");

  function closeAllDropdowns() {
    if (saveDropdown) saveDropdown.classList.add("hidden");
    if (loadDropdown) loadDropdown.classList.add("hidden");
    const settingsDropdownEl = document.getElementById("settingsDropdown");
    if (settingsDropdownEl) settingsDropdownEl.classList.add("hidden");
  }

  if (saveCanvasBtn) {
    saveCanvasBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (loadDropdown) loadDropdown.classList.add("hidden");
      if (saveDropdown) saveDropdown.classList.toggle("hidden");
    });
  }

  if (loadCanvasBtn) {
    loadCanvasBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (saveDropdown) saveDropdown.classList.add("hidden");
      if (loadDropdown) loadDropdown.classList.toggle("hidden");
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#saveDropdownWrap")) {
      if (saveDropdown) saveDropdown.classList.add("hidden");
    }
    if (!e.target.closest("#loadDropdownWrap")) {
      if (loadDropdown) loadDropdown.classList.add("hidden");
    }
  });

  if (saveToBrowser) {
    saveToBrowser.addEventListener("click", () => {
      closeAllDropdowns();
      openSaveModal();
    });
  }

  if (saveToFile) {
    saveToFile.addEventListener("click", () => {
      closeAllDropdowns();
      const state = CanvasApp.getState();
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `canvas-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (exportMarkdownBtn) {
    exportMarkdownBtn.addEventListener("click", () => {
      closeAllDropdowns();
      const state = CanvasApp.getState();
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const md = stateToMarkdown(state);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `canvas-${ts}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (loadFromBrowser) {
    loadFromBrowser.addEventListener("click", () => {
      closeAllDropdowns();
      openLoadModal();
    });
  }

  if (loadFromFile) {
    loadFromFile.addEventListener("click", () => {
      closeAllDropdowns();
      if (importCanvasFile) importCanvasFile.click();
    });
  }

  if (importCanvasFile) {
    importCanvasFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const state = JSON.parse(reader.result);
          if (!state.nodes || !Array.isArray(state.nodes)) {
            alert(t("invalidFormat"));
            return;
          }
          CanvasApp.loadState(state);
        } catch (_) {
          alert(t("fileParseFailed"));
        }
      };
      reader.readAsText(file);
      importCanvasFile.value = "";
    });
  }

  const playMethodBtn = document.getElementById("playMethodBtn");
  const playMethodModal = document.getElementById("playMethodModal");
  const playMethodMask = document.getElementById("playMethodMask");
  const playMethodCloseBtn = document.getElementById("playMethodCloseBtn");

  function openPlayMethodModal() {
    if (playMethodModal) playMethodModal.classList.remove("hidden");
    renderCustomPlayMethods();
  }
  function closePlayMethodModal() {
    if (playMethodModal) playMethodModal.classList.add("hidden");
  }

  if (playMethodBtn) {
    playMethodBtn.addEventListener("click", () => {
      openPlayMethodModal();
    });
  }
  if (playMethodMask) {
    playMethodMask.addEventListener("click", closePlayMethodModal);
  }
  if (playMethodCloseBtn) {
    playMethodCloseBtn.addEventListener("click", closePlayMethodModal);
  }

  // Bind play method cards
  document.querySelectorAll(".play-method-card").forEach((card) => {
    card.addEventListener("click", () => {
      const method = card.dataset.method;
      if (!method) return;
      closePlayMethodModal();
      executePlayMethod(method);
    });
  });

  // Save as play method button
  const saveAsPlayMethodBtn = document.getElementById("saveAsPlayMethodBtn");
  if (saveAsPlayMethodBtn) {
    saveAsPlayMethodBtn.addEventListener("click", () => {
      saveCurrentCanvasAsPlayMethod();
    });
  }

  // ── AI Wand Modal ──
  const aiWandModal = document.getElementById("aiWandModal");
  const aiWandMask = document.getElementById("aiWandMask");
  const aiWandCloseBtn = document.getElementById("aiWandCloseBtn");
  const aiWandInput = document.getElementById("aiWandInput");
  const aiWandGenerateBtn = document.getElementById("aiWandGenerateBtn");
  const aiWandStatus = document.getElementById("aiWandStatus");
  let aiWandAbort = null;

  function openAiWandModal() {
    if (aiWandModal) aiWandModal.classList.remove("hidden");
    if (aiWandInput) aiWandInput.focus();
  }
  function closeAiWandModal() {
    if (aiWandModal) aiWandModal.classList.add("hidden");
    if (aiWandStatus) aiWandStatus.textContent = "";
  }

  if (aiWandBtn) {
    aiWandBtn.addEventListener("click", () => {
      confirmCanvasSwitch((choice) => {
        if (choice === "cancel") return;
        openAiWandModal();
      });
    });
  }
  if (aiWandMask) {
    aiWandMask.addEventListener("click", closeAiWandModal);
  }
  if (aiWandCloseBtn) {
    aiWandCloseBtn.addEventListener("click", closeAiWandModal);
  }

  if (aiWandGenerateBtn) {
    aiWandGenerateBtn.addEventListener("click", async () => {
      const need = (aiWandInput.value || "").trim();
      if (!need) {
        aiWandStatus.textContent = t("genCanvasPlease");
        aiWandStatus.className = "play-method-gen-status error";
        aiWandInput.focus();
        return;
      }
      const cfg = getApiConfig();
      if (!cfg.apiKey) {
        aiWandStatus.textContent = t("genCanvasApi");
        aiWandStatus.className = "play-method-gen-status error";
        return;
      }

      if (aiWandAbort) aiWandAbort.abort();
      aiWandAbort = new AbortController();
      aiWandGenerateBtn.disabled = true;
      aiWandGenerateBtn.style.opacity = "0.5";

      // Close modal immediately and start bulb pulsing
      closeAiWandModal();
      CanvasApp.clear();
      CanvasApp.pulseBulb();
      CanvasApp.setBulbStatus(t("bulbAnalyzing"));

      aiWandStatus.textContent = t("genCanvasGenerating");
      aiWandStatus.className = "play-method-gen-status";

      // Build card list dynamically from allItems
      const cardListStr = allItems.map(card => `- ${card.title} → ${card.stage}`).join("\n");

      const systemMsgZh = `你是一位科研方法论专家，精通各种抽象的、跨领域通用的科研"玩法"（研究策略）。

用户会给你一个描述，你需要设计一个包含分支和汇合的流程图（DAG），而不是简单的线性流程。

输出格式要求（严格遵守）：
1. 第一行输出玩法名称，4-8个字的中文短标题
2. 从第二行开始，输出 JSON 数组，每个元素代表流程中的一个步骤卡片
3. 每个步骤包含以下字段：
   - title：卡片标题（必须是下方可用卡片之一，或用 newCard 创建新卡片）
   - label：该步骤的副标题/备注，可为空字符串
   - stage：所属阶段名称
   - level：层级编号（从0开始），同一层级的卡片会并排显示
   - dependsOn：依赖的步骤索引数组（从0开始），省略则默认依赖上一步

关键设计原则——分层思考：
- level 代表"思考层级"。同一 level 的卡片是并行关系（同时执行），不同 level 是串行关系（先后执行）
- 判断两张卡片是否同一层的核心标准：它们之间是否存在数据依赖？如果 B 不需要 A 的输出就能执行，那么 A 和 B 应该在同一层
- 例如：精读论文 A 和精读论文 B 是并行的（互不依赖），所以都在 level 0；但"评估方法迁移"需要读完两篇论文，所以在 level 1
- dependsOn 只引用直接父节点，不要引用祖父节点。如果 A→B→C，C 只需要 dependsOn: [B的索引]，不需要同时引用 A
- 流程应该是有向无环图（DAG），不要有循环

可用的已有卡片标题和所属阶段：
${cardListStr}

如果已有卡片不够用，用 newCard 字段创建新卡片：
{ "newCard": "卡片名称", "stage": "阶段 X：XXX", "prompt": "# Role\\n你是...\\n# Task\\n...\\n# Input\\n[在此处粘贴...]", "level": 0, "dependsOn": [] }

示例1 — A+B 跨域迁移（三篇论文并排 → 汇聚 → 分支）：
A+B 跨域迁移
[
  { "title": "精读论文", "label": "主体论文", "stage": "阶段 1：调研选题", "level": 0 },
  { "title": "精读论文", "label": "灵感论文 A", "stage": "阶段 1：调研选题", "level": 0 },
  { "title": "精读论文", "label": "灵感论文 B", "stage": "阶段 1：调研选题", "level": 0 },
  { "title": "评估方法迁移", "label": "融合可行性", "stage": "阶段 2：构思 Idea", "level": 1, "dependsOn": [0, 1, 2] },
  { "title": "提炼创新点", "label": "", "stage": "阶段 2：构思 Idea", "level": 2, "dependsOn": [3] },
  { "title": "设计方法架构", "label": "融合方案", "stage": "阶段 3：设计方法", "level": 3, "dependsOn": [4] },
  { "title": "设计实验方案", "label": "", "stage": "阶段 4：执行实验", "level": 4, "dependsOn": [5] },
  { "title": "分析实验结果", "label": "", "stage": "阶段 4：执行实验", "level": 5, "dependsOn": [6] },
  { "title": "撰写 Method 章节", "label": "", "stage": "阶段 5：写论文", "level": 6, "dependsOn": [7] },
  { "title": "撰写 Abstract", "label": "", "stage": "阶段 5：写论文", "level": 6, "dependsOn": [7] }
]

示例2 — Benchmark 构建（线性流程）：
Benchmark构建
[
  { "title": "梳理领域", "label": "现有Benchmark调研", "stage": "阶段 1：调研选题", "level": 0 },
  { "title": "精读论文", "label": "主流数据集分析", "stage": "阶段 1：调研选题", "level": 0 },
  { "title": "分析现有 Benchmark", "label": "", "stage": "阶段 1：调研选题", "level": 1, "dependsOn": [0, 1] },
  { "title": "定义任务", "label": "评测任务形式化", "stage": "阶段 2：构思 Idea", "level": 2, "dependsOn": [2] },
  { "title": "设计评估协议", "label": "", "stage": "阶段 4：执行实验", "level": 3, "dependsOn": [3] },
  { "title": "构造数据 Pipeline", "label": "评测数据", "stage": "阶段 3：设计方法", "level": 3, "dependsOn": [3] },
  { "title": "评估数据质量", "label": "", "stage": "阶段 4：执行实验", "level": 4, "dependsOn": [5] },
  { "title": "设计实验方案", "label": "基线评测", "stage": "阶段 4：执行实验", "level": 4, "dependsOn": [4, 5] },
  { "title": "分析实验结果", "label": "", "stage": "阶段 4：执行实验", "level": 5, "dependsOn": [7] },
  { "title": "撰写 Method 章节", "label": "Benchmark描述", "stage": "阶段 5：写论文", "level": 6, "dependsOn": [8] },
  { "title": "撰写 Abstract", "label": "", "stage": "阶段 5：写论文", "level": 6, "dependsOn": [8] }
]

只输出标题行 + JSON 数组，不要任何额外解释。`;

      const systemMsgEn = `You are a research methodology expert, proficient in various abstract, cross-domain universal research "play methods" (research strategies).

The user will give you a description. You need to design a flowchart (DAG) with branching and merging, not a simple linear flow.

Output format requirements (strictly follow):
1. First line: play method name, a short English title (4-8 words)
2. Starting from the second line, output a JSON array where each element represents a step card in the workflow
3. Each step contains the following fields:
   - title: card title (must be one of the available cards below, or use newCard to create a new card)
   - label: subtitle/note for this step, can be empty string
   - stage: stage name
   - level: level number (starting from 0), cards at the same level will be displayed side by side
   - dependsOn: array of step indices this step depends on (starting from 0), defaults to previous step if omitted

Key design principles — layer-based thinking:
- A "level" represents a thinking layer. Cards at the same level are parallel (executed simultaneously); cards at different levels are sequential (executed in order)
- Core rule for same-layer placement: does card B need card A's output? If B can run without A's output, A and B belong to the same level
- Example: "Deep-Read Paper A" and "Deep-Read Paper B" are parallel (independent), so both at level 0; but "Assess Method Transfer" needs both papers read, so it goes to level 1
- dependsOn should only reference direct parent nodes, not grandparent nodes. If A→B→C, C only needs dependsOn: [B's index], not both A and B
- The workflow should be a directed acyclic graph (DAG), no cycles

Available card titles and their stages:
${cardListStr}

If existing cards are not enough, use the newCard field to create new cards:
{ "newCard": "Card Name", "stage": "Stage X: XXX", "prompt": "# Role\\nYou are...\\n# Task\\n...\\n# Input\\n[Paste here...]", "level": 0, "dependsOn": [] }

Example 1 — A+B Cross-Domain Transfer (three papers side by side → converge → branch):
A+B Cross-Domain Transfer
[
  { "title": "Deep-Read Papers", "label": "Main Paper", "stage": "Stage 1: Research Topics", "level": 0 },
  { "title": "Deep-Read Papers", "label": "Inspiration Paper A", "stage": "Stage 1: Research Topics", "level": 0 },
  { "title": "Deep-Read Papers", "label": "Inspiration Paper B", "stage": "Stage 1: Research Topics", "level": 0 },
  { "title": "Assess Method Transfer", "label": "Integration Feasibility", "stage": "Stage 2: Conceive Ideas", "level": 1, "dependsOn": [0, 1, 2] },
  { "title": "Extract Innovation Points", "label": "", "stage": "Stage 2: Conceive Ideas", "level": 2, "dependsOn": [3] },
  { "title": "Design Method Architecture", "label": "Integration Plan", "stage": "Stage 3: Design Methods", "level": 3, "dependsOn": [4] },
  { "title": "Design Experiment Plan", "label": "", "stage": "Stage 4: Run Experiments", "level": 4, "dependsOn": [5] },
  { "title": "Analyze Experiment Results", "label": "", "stage": "Stage 4: Run Experiments", "level": 5, "dependsOn": [6] },
  { "title": "Write Method Section", "label": "", "stage": "Stage 5: Write Paper", "level": 6, "dependsOn": [7] },
  { "title": "Write Abstract", "label": "", "stage": "Stage 5: Write Paper", "level": 6, "dependsOn": [7] }
]

Example 2 — Benchmark Construction (linear flow):
Benchmark Construction
[
  { "title": "Map Research Landscape", "label": "Existing Benchmark Survey", "stage": "Stage 1: Research Topics", "level": 0 },
  { "title": "Deep-Read Papers", "label": "Mainstream Dataset Analysis", "stage": "Stage 1: Research Topics", "level": 0 },
  { "title": "Analyze Existing Benchmarks", "label": "", "stage": "Stage 1: Research Topics", "level": 1, "dependsOn": [0, 1] },
  { "title": "Define Task", "label": "Evaluation Task Formalization", "stage": "Stage 2: Conceive Ideas", "level": 2, "dependsOn": [2] },
  { "title": "Design Evaluation Protocol", "label": "", "stage": "Stage 4: Run Experiments", "level": 3, "dependsOn": [3] },
  { "title": "Build Data Pipeline", "label": "Evaluation Data", "stage": "Stage 3: Design Methods", "level": 3, "dependsOn": [3] },
  { "title": "Assess Data Quality", "label": "", "stage": "Stage 4: Run Experiments", "level": 4, "dependsOn": [5] },
  { "title": "Design Experiment Plan", "label": "Baseline Evaluation", "stage": "Stage 4: Run Experiments", "level": 4, "dependsOn": [4, 5] },
  { "title": "Analyze Experiment Results", "label": "", "stage": "Stage 4: Run Experiments", "level": 5, "dependsOn": [7] },
  { "title": "Write Method Section", "label": "Benchmark Description", "stage": "Stage 5: Write Paper", "level": 6, "dependsOn": [8] },
  { "title": "Write Abstract", "label": "", "stage": "Stage 5: Write Paper", "level": 6, "dependsOn": [8] }
]

Output only the title line + JSON array, no additional explanation.`;

      const systemMsg = currentPromptLang === "en" ? systemMsgEn : systemMsgZh;

      try {
        let fullText = "";
        await callApi(cfg, systemMsg, need, (text) => {
          fullText += text;
          aiWandStatus.textContent = t("genCanvasGeneratingStatus").replace("{count}", fullText.length);
          aiWandStatus.className = "play-method-gen-status";
          CanvasApp.setBulbStatus(t("bulbGenerating"));
        }, aiWandAbort.signal);

        // Parse response: first line = name, rest = JSON
        const lines = fullText.trim().split("\n");
        const nameLine = lines[0].trim();
        const jsonStr = lines.slice(1).join("\n").trim();

        let pipeline;
        try {
          pipeline = JSON.parse(jsonStr);
        } catch (_) {
          const match = jsonStr.match(/\[[\s\S]*\]/);
          if (match) {
            pipeline = JSON.parse(match[0]);
          } else {
            throw new Error(t("genCanvasParseError"));
          }
        }

        if (!Array.isArray(pipeline) || pipeline.length === 0) {
          throw new Error(t("genCanvasEmptyError"));
        }

        // Assign default dependsOn for steps that don't specify it (or have empty array)
        pipeline.forEach((step, i) => {
          if ((!step.dependsOn || step.dependsOn.length === 0) && i > 0) {
            step.dependsOn = [i - 1];
          }
        });

        console.log("[AI Layout] Raw pipeline:", pipeline.map((s, i) => `${i}(${s.title}):${JSON.stringify(s.dependsOn || [])}`).join(", "));

        // Remove transitive edges: if A→B→C, remove A→C from dependsOn
        {
          console.log("[AI Layout] Before transitive reduction:", pipeline.map((s, i) => `${i}:${JSON.stringify(s.dependsOn || [])}`).join(", "));
          const n = pipeline.length;
          const reachable = new Array(n).fill(null).map(() => new Set());
          // BFS from each node to find all transitive descendants (following parent→child direction)
          for (let i = 0; i < n; i++) {
            const visited = new Set([i]);
            const queue = [i];
            while (queue.length > 0) {
              const cur = queue.shift();
              for (let j = 0; j < n; j++) {
                if (visited.has(j)) continue;
                const deps = pipeline[j].dependsOn || [];
                if (deps.includes(cur)) {
                  visited.add(j);
                  reachable[i].add(j);
                  queue.push(j);
                }
              }
            }
          }
          // For each step, remove dependsOn entries that are transitively reachable through another direct parent
          let removedCount = 0;
          pipeline.forEach((step, i) => {
            if (!step.dependsOn || step.dependsOn.length <= 1) return;
            const direct = new Set(step.dependsOn);
            for (const parent of [...step.dependsOn]) {
              for (const otherParent of step.dependsOn) {
                if (otherParent !== parent && reachable[otherParent].has(parent)) {
                  direct.delete(parent);
                  removedCount++;
                  console.log(`[AI Layout] Removing transitive edge: step ${i} dependsOn ${parent} (reachable via ${otherParent})`);
                  break;
                }
              }
            }
            step.dependsOn = [...direct].sort((a, b) => a - b);
          });
          console.log("[AI Layout] After transitive reduction:", pipeline.map((s, i) => `${i}:${JSON.stringify(s.dependsOn || [])}`).join(", "), `(${removedCount} edges removed)`);
        }

        // Process pipeline: create missing cards
        const existingTitles = new Set();
        allItems.forEach((card) => { if (card && card.title) existingTitles.add(card.title); });
        const createdTitles = new Set();

        pipeline.forEach((step) => {
          if (step.newCard) {
            const title = step.newCard;
            const stage = step.stage || "";
            const prompt = step.prompt || `# Role\n你是一位专业的研究助手。\n\n# Task\n请根据标题「${title}」完成相应的研究任务。\n\n# Input\n在此处粘贴需要处理的内容...`;
            if (!existingTitles.has(title) && !createdTitles.has(title)) {
              const id = buildCustomCardId();
              state.customCards.push({ id, title, category: stage, prompt, stageId: "" });
              createdTitles.add(title);
            }
            step.title = title;
            delete step.newCard;
          }
        });

        if (createdTitles.size > 0) {
          commitState();
          refreshAllItems();
          CanvasApp.setAllItems(allItems);
        }

        // Apply animated pipeline (modal already closed, canvas cleared, bulb pulsing)
        CanvasApp.setBulbStatus(t("bulbDrawing"));
        CanvasApp.addPipelineAnimated(pipeline, () => {
          CanvasApp.lightBulb();
          aiWandStatus.textContent = t("genCanvasDone").replace("{name}", nameLine).replace("{count}", pipeline.length);
          aiWandStatus.className = "play-method-gen-status success";
        });
      } catch (err) {
        CanvasApp.dimBulb();
        CanvasApp.setBulbStatus("");
        if (err.name === "AbortError") {
          aiWandStatus.textContent = t("genCanvasCancelled");
          aiWandStatus.className = "play-method-gen-status";
        } else {
          aiWandStatus.textContent = t("genCanvasFailed") + err.message;
          aiWandStatus.className = "play-method-gen-status error";
        }
      } finally {
        aiWandGenerateBtn.disabled = false;
        aiWandGenerateBtn.style.opacity = "";
        aiWandAbort = null;
      }
    });
  }

  // ── Settings Dropdown ──
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsDropdown = document.getElementById("settingsDropdown");
  const settingsApiBtn = document.getElementById("settingsApiBtn");
  const settingsClearCacheBtn = document.getElementById("settingsClearCacheBtn");

  if (settingsBtn && settingsDropdown) {
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !settingsDropdown.classList.contains("hidden");
      closeAllDropdowns();
      if (!isOpen) {
        settingsDropdown.classList.remove("hidden");
        // Show last push time
        const tsEl = document.getElementById("settingsTimestamp");
        if (tsEl) {
          tsEl.textContent = t("updatedAt").replace("{time}", LAST_MODIFIED);
        }
        // Update about button text
        const aboutBtn = document.getElementById("settingsAboutBtn");
        if (aboutBtn) {
          aboutBtn.textContent = t("about") + " " + t("siteTitle");
        }
        // Reset contact author button text
        const contactBtn = document.getElementById("settingsContactBtn");
        if (contactBtn) {
          contactBtn.textContent = t("contactAuthor");
        }
        // Update dev mode label text
        const devLabel = document.getElementById("devModeLabel");
        if (devLabel) {
          devLabel.textContent = t("devMode");
        }
      }
    });
  }

  // Dev mode toggle — show/hide clear cache button
  const devModeToggle = document.getElementById("devModeToggle");
  const devModeContent = document.getElementById("devModeContent");
  if (devModeToggle && devModeContent) {
    // Restore saved state
    const savedDevMode = localStorage.getItem("dev-mode");
    if (savedDevMode === "true") {
      devModeToggle.checked = true;
      devModeContent.classList.remove("hidden");
    }
    devModeToggle.addEventListener("change", () => {
      devModeContent.classList.toggle("hidden", !devModeToggle.checked);
      localStorage.setItem("dev-mode", devModeToggle.checked);
    });
  }

  if (settingsApiBtn) {
    settingsApiBtn.addEventListener("click", () => {
      settingsDropdown.classList.add("hidden");
      openApiConfig();
    });
  }

  if (settingsClearCacheBtn) {
    settingsClearCacheBtn.addEventListener("click", () => {
      if (confirm("确定清除所有本地缓存？页面将刷新。")) {
        const keepDevMode = devModeToggle && devModeToggle.checked;
        localStorage.clear();
        if (keepDevMode) localStorage.setItem("dev-mode", "true");
        location.reload();
      }
    });
  }

  // Contact author — click to reveal email, copy, and show toast
  const settingsContactBtn = document.getElementById("settingsContactBtn");
  if (settingsContactBtn) {
    settingsContactBtn.textContent = t("contactAuthor");
    settingsContactBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(AUTHOR_EMAIL).catch(() => {});
      settingsContactBtn.textContent = AUTHOR_EMAIL;
      showToast(t("emailCopied"));
    });
  }

  // Toast helper
  function showToast(message) {
    let toastEl = document.getElementById("toastMessage");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "toastMessage";
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2000);
  }

  // Changelog modal
  const changelogModal = document.getElementById("changelogModal");
  const changelogMask = document.getElementById("changelogMask");
  const changelogCloseX = document.getElementById("changelogCloseX");
  const changelogBody = document.getElementById("changelogBody");
  const changelogTitle = document.getElementById("changelogTitle");

  function renderChangelog() {
    if (!changelogBody || !changelogTitle) return;
    changelogTitle.textContent = t("changelog");
    let html = "";
    for (const day of CHANGELOG) {
      html += '<div class="changelog-day">';
      html += '<div class="changelog-day-title">' + day.date + "</div>";
      if (day.am) {
        html += '<div class="changelog-period">';
        html += '<div class="changelog-period-title">上午 ' + day.am.time + "</div>";
        html += '<ol class="changelog-list">';
        for (const item of day.am.items) {
          html += "<li>" + item + "</li>";
        }
        html += "</ol></div>";
      }
      if (day.pm) {
        html += '<div class="changelog-period">';
        html += '<div class="changelog-period-title">下午 ' + day.pm.time + "</div>";
        html += '<ol class="changelog-list">';
        for (const item of day.pm.items) {
          html += "<li>" + item + "</li>";
        }
        html += "</ol></div>";
      }
      html += "</div>";
    }
    changelogBody.innerHTML = html;
  }

  const settingsChangelogBtn = document.getElementById("settingsChangelogBtn");
  if (settingsChangelogBtn && changelogModal) {
    settingsChangelogBtn.addEventListener("click", () => {
      settingsDropdown.classList.add("hidden");
      renderChangelog();
      changelogModal.classList.remove("hidden");
    });
  }

  if (changelogMask) {
    changelogMask.addEventListener("click", () => {
      changelogModal.classList.add("hidden");
    });
  }

  if (changelogCloseX) {
    changelogCloseX.addEventListener("click", () => {
      changelogModal.classList.add("hidden");
    });
  }


  // ── Drawer toggle ──
  const drawerEl = document.getElementById("canvasDrawer");
  const drawerToggleBtn = document.getElementById("drawerToggleBtn");

  // Tutorial modal
  const tutorialModal = document.getElementById("tutorialModal");
  const tutorialMask = document.getElementById("tutorialMask");
  const tutorialCloseX = document.getElementById("tutorialCloseX");
  const settingsTutorialBtn = document.getElementById("settingsTutorialBtn");
  if (settingsTutorialBtn && tutorialModal) {
    settingsTutorialBtn.addEventListener("click", () => {
      settingsDropdown.classList.add("hidden");
      tutorialModal.classList.remove("hidden");
    });
  }
  if (tutorialMask) {
    tutorialMask.addEventListener("click", () => {
      tutorialModal.classList.add("hidden");
    });
  }
  if (tutorialCloseX) {
    tutorialCloseX.addEventListener("click", () => {
      tutorialModal.classList.add("hidden");
    });
  }

  // About modal
  const aboutModal = document.getElementById("aboutModal");
  const aboutMask = document.getElementById("aboutMask");
  const aboutCloseX = document.getElementById("aboutCloseX");
  const settingsAboutBtn = document.getElementById("settingsAboutBtn");
  const aboutTitle = document.getElementById("aboutTitle");
  if (settingsAboutBtn && aboutModal) {
    settingsAboutBtn.addEventListener("click", () => {
      settingsDropdown.classList.add("hidden");
      if (aboutTitle) aboutTitle.textContent = t("about") + " " + t("siteTitle");
      aboutModal.classList.remove("hidden");
    });
  }
  if (aboutMask) {
    aboutMask.addEventListener("click", () => {
      aboutModal.classList.add("hidden");
    });
  }
  if (aboutCloseX) {
    aboutCloseX.addEventListener("click", () => {
      aboutModal.classList.add("hidden");
    });
  }

  if (drawerToggleBtn && drawerEl) {
    drawerToggleBtn.addEventListener("click", () => {
      drawerEl.classList.toggle("collapsed");
    });
  }
}

function confirmCanvasSwitch(callback) {
  const curState = CanvasApp.getState();
  const hasContent = curState.nodes && curState.nodes.some((n) => n.cardId !== "__start__" && n.cardId !== "__end__");
  if (!hasContent) {
    callback("discard");
    return;
  }
  const modal = document.getElementById("canvasSwitchModal");
  const mask = document.getElementById("canvasSwitchMask");
  const saveBtn = document.getElementById("switchSaveBtn");
  const discardBtn = document.getElementById("switchDiscardBtn");
  const cancelBtn = document.getElementById("switchCancelBtn");
  const mainActions = document.getElementById("switchMainActions");
  const saveChoice = document.getElementById("switchSaveChoice");
  const saveToBrowser = document.getElementById("switchSaveToBrowser");
  const saveToFileBtn = document.getElementById("switchSaveToFile");
  const saveBack = document.getElementById("switchSaveBack");

  function close() {
    if (modal) modal.classList.add("hidden");
    if (mainActions) mainActions.classList.remove("hidden");
    if (saveChoice) saveChoice.classList.add("hidden");
    saveBtn.onclick = null;
    discardBtn.onclick = null;
    cancelBtn.onclick = null;
    mask.onclick = null;
    if (saveToBrowser) saveToBrowser.onclick = null;
    if (saveToFileBtn) saveToFileBtn.onclick = null;
    if (saveBack) saveBack.onclick = null;
  }

  if (modal) modal.classList.remove("hidden");

  saveBtn.onclick = () => {
    if (mainActions) mainActions.classList.add("hidden");
    if (saveChoice) saveChoice.classList.remove("hidden");
  };
  discardBtn.onclick = () => { close(); callback("discard"); };
  cancelBtn.onclick = () => { close(); callback("cancel"); };
  mask.onclick = () => { close(); callback("cancel"); };

  if (saveToBrowser) {
    saveToBrowser.onclick = () => {
      close();
      afterSaveCallback = () => callback("discard");
      openSaveModal();
    };
  }
  if (saveToFileBtn) {
    saveToFileBtn.onclick = () => {
      const state = CanvasApp.getState();
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `canvas-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
      close();
      callback("discard");
    };
  }
  if (saveBack) {
    saveBack.onclick = () => {
      if (mainActions) mainActions.classList.remove("hidden");
      if (saveChoice) saveChoice.classList.add("hidden");
    };
  }
}

// ── Custom Play Methods ──

const CUSTOM_PLAY_METHODS_KEY = "custom-play-methods";

function getCustomPlayMethods() {
  try {
    const raw = localStorage.getItem(CUSTOM_PLAY_METHODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveCustomPlayMethods(list) {
  try {
    localStorage.setItem(CUSTOM_PLAY_METHODS_KEY, JSON.stringify(list));
  } catch (_) {}
}

function extractPipelineFromCanvas() {
  const canvasState = CanvasApp.getState();
  if (!canvasState.nodes || canvasState.nodes.length === 0) return null;

  const nodes = canvasState.nodes;
  const edges = canvasState.edges;

  // Build adjacency from edges
  const childrenOf = new Map();
  const parentCount = new Map();
  nodes.forEach((n) => { childrenOf.set(n.id, []); parentCount.set(n.id, 0); });
  edges.forEach((e) => {
    if (childrenOf.has(e.from) && parentCount.has(e.to)) {
      childrenOf.get(e.from).push(e.to);
      parentCount.set(e.to, parentCount.get(e.to) + 1);
    }
  });

  // Topological sort from start node
  const startNode = nodes.find((n) => n.cardId === "__start__");
  if (!startNode) return null;

  const visited = new Set();
  const order = [];
  const queue = [startNode.id];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    order.push(cur);
    for (const childId of (childrenOf.get(cur) || [])) {
      queue.push(childId);
    }
  }

  // Extract pipeline steps (skip start/end nodes)
  const pipeline = [];
  const cardMap = new Map(allItems.map((c) => [c.id, c]));
  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.cardId === "__start__" || node.cardId === "__end__") continue;
    const card = cardMap.get(node.cardId);
    const title = card ? card.title : node.cardId;
    const stage = card ? (card.category || "") : "";
    pipeline.push({ title, label: node.subtitle || "", stage });
  }

  return pipeline.length > 0 ? pipeline : null;
}

function saveCurrentCanvasAsPlayMethod() {
  const pipeline = extractPipelineFromCanvas();
  if (!pipeline) {
    alert(t("playMethodEmpty"));
    return;
  }

  const name = prompt(t("playMethodNamePrompt"));
  if (!name || !name.trim()) return;

  const methods = getCustomPlayMethods();
  methods.push({
    id: "pm_" + Date.now(),
    name: name.trim(),
    pipeline,
  });
  saveCustomPlayMethods(methods);
  renderCustomPlayMethods();
}

function renderCustomPlayMethods() {
  const grid = document.getElementById("customMethodsGrid");
  if (!grid) return;
  const methods = getCustomPlayMethods();
  // Keep the "+" button, remove the rest
  const addBtn = document.getElementById("saveAsPlayMethodBtn");
  grid.innerHTML = "";
  if (addBtn) grid.appendChild(addBtn);

  methods.forEach((method) => {
    const card = document.createElement("button");
    card.className = "play-method-card";
    card.type = "button";
    card.addEventListener("click", () => {
      const modal = document.getElementById("playMethodModal");
      if (modal) modal.classList.add("hidden");
      executeCustomPlayMethod(method.id);
    });

    const circle = document.createElement("span");
    circle.className = "play-method-circle";
    circle.textContent = "📋";

    const nameEl = document.createElement("span");
    nameEl.className = "play-method-name";
    nameEl.textContent = method.name;

    // Delete button (top-right of circle)
    const delBtn = document.createElement("button");
    delBtn.className = "play-method-custom-del";
    delBtn.type = "button";
    delBtn.textContent = "×";
    delBtn.title = t("delete");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(t("playMethodDeleteConfirm"))) return;
      const updated = getCustomPlayMethods().filter((m) => m.id !== method.id);
      saveCustomPlayMethods(updated);
      renderCustomPlayMethods();
    });

    card.append(circle, nameEl, delBtn);
    grid.appendChild(card);
  });
}

function executeCustomPlayMethod(id) {
  const methods = getCustomPlayMethods();
  const method = methods.find((m) => m.id === id);
  if (!method || !method.pipeline) return;

  const applyMethod = () => {
    CanvasApp.clear();
    // Ensure pipeline cards exist
    const existing = new Set();
    if (typeof allItems !== "undefined") {
      allItems.forEach((card) => { if (card && card.title) existing.add(card.title); });
    }
    const seen = new Set();
    method.pipeline.forEach(({ title, stage }) => {
      if (existing.has(title) || seen.has(title)) return;
      seen.add(title);
      const category = stage || "未分类";
      const prompt = `# Role\n你是一位专业的研究助手。\n\n# Task\n请根据标题「${title}」完成相应的研究任务。\n\n# Input\n在此处粘贴需要处理的内容...`;
      const id = buildCustomCardId();
      state.customCards.push({ id, title, category, prompt, stageId: "" });
    });
    if (seen.size > 0) {
      commitState();
      refreshAllItems();
      CanvasApp.setAllItems(allItems);
    }
    CanvasApp.addPipeline(method.pipeline);
  };

  confirmCanvasSwitch((choice) => {
    if (choice === "cancel") return;
    applyMethod();
  });
}

function executePlayMethod(method) {
  const applyMethod = () => {
    if (method === "empty") {
      CanvasApp.clear();
      return;
    }

    CanvasApp.clear();

    const pipelinesZh = {
    "cross-domain": [
      { title: "精读论文", label: "论文 A（源领域）", stage: "阶段 1：调研选题" },
      { title: "精读论文", label: "论文 B（目标领域）", stage: "阶段 1：调研选题" },
      { title: "评估方法迁移", label: "", stage: "阶段 2：构思 Idea" },
      { title: "头脑风暴 Idea", label: "融合方案", stage: "阶段 2：构思 Idea" },
      { title: "提炼创新点", label: "", stage: "阶段 2：构思 Idea" },
      { title: "设计方法架构", label: "", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    efficiency: [
      { title: "精读论文", label: "目标方法", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "效率瓶颈分析", stage: "阶段 1：调研选题" },
      { title: "设计方法架构", label: "优化方案", stage: "阶段 3：设计方法" },
      { title: "设计损失函数与优化策略", label: "", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "效率对比", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "质量-效率权衡", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    workflow: [
      { title: "精读论文", label: "参考论文", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "现有流程分析", stage: "阶段 1：调研选题" },
      { title: "分析 Workflow 结构", label: "", stage: "阶段 3：设计方法" },
      { title: "设计多阶段系统", label: "", stage: "阶段 3：设计方法" },
      { title: "评估可行性", label: "", stage: "阶段 2：构思 Idea" },
      { title: "设计方法架构", label: "", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    robustness: [
      { title: "精读论文", label: "目标模型", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "安全风险调研", stage: "阶段 1：调研选题" },
      { title: "设计失败场景", label: "", stage: "阶段 2：构思 Idea" },
      { title: "评估可行性", label: "防御方案", stage: "阶段 2：构思 Idea" },
      { title: "设计方法架构", label: "安全机制", stage: "阶段 3：设计方法" },
      { title: "设计评估协议", label: "", stage: "阶段 4：执行实验" },
      { title: "设计实验方案", label: "攻防测试", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    theory: [
      { title: "精读论文", label: "核心论文", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "设计空间", stage: "阶段 1：调研选题" },
      { title: "头脑风暴 Idea", label: "假设提出", stage: "阶段 2：构思 Idea" },
      { title: "评估可行性", label: "理论验证", stage: "阶段 2：构思 Idea" },
      { title: "设计方法架构", label: "机制分析", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "对比实验", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "提炼创新点", label: "设计原则", stage: "阶段 2：构思 Idea" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    "new-benchmark": [
      { title: "精读论文", label: "相关论文", stage: "阶段 1：调研选题" },
      { title: "分析现有 Benchmark", label: "", stage: "阶段 1：调研选题" },
      { title: "定义任务", label: "", stage: "阶段 2：构思 Idea" },
      { title: "设计评估协议", label: "", stage: "阶段 4：执行实验" },
      { title: "构造数据 Pipeline", label: "评测数据", stage: "阶段 3：设计方法" },
      { title: "评估数据质量", label: "", stage: "阶段 4：执行实验" },
      { title: "设计实验方案", label: "基线评测", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    system: [
      { title: "精读论文", label: "相关论文", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "系统需求分析", stage: "阶段 1：调研选题" },
      { title: "分析 Workflow 结构", label: "系统架构", stage: "阶段 3：设计方法" },
      { title: "设计多阶段系统", label: "", stage: "阶段 3：设计方法" },
      { title: "设计方法架构", label: "组件集成", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "端到端测试", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    dataset: [
      { title: "精读论文", label: "参考论文", stage: "阶段 1：调研选题" },
      { title: "梳理领域", label: "数据需求分析", stage: "阶段 1：调研选题" },
      { title: "定义任务", label: "", stage: "阶段 2：构思 Idea" },
      { title: "构造数据 Pipeline", label: "", stage: "阶段 3：设计方法" },
      { title: "评估数据质量", label: "", stage: "阶段 4：执行实验" },
      { title: "设计实验方案", label: "数据验证", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
    metric: [
      { title: "精读论文", label: "相关论文", stage: "阶段 1：调研选题" },
      { title: "分析现有 Benchmark", label: "现有指标分析", stage: "阶段 1：调研选题" },
      { title: "定义任务", label: "评估维度", stage: "阶段 2：构思 Idea" },
      { title: "评估可行性", label: "指标设计", stage: "阶段 2：构思 Idea" },
      { title: "设计评估协议", label: "", stage: "阶段 4：执行实验" },
      { title: "构造数据 Pipeline", label: "评测数据", stage: "阶段 3：设计方法" },
      { title: "设计实验方案", label: "人类评估", stage: "阶段 4：执行实验" },
      { title: "分析实验结果", label: "", stage: "阶段 4：执行实验" },
      { title: "撰写 Method 章节", label: "", stage: "阶段 5：写论文" },
      { title: "撰写 Abstract", label: "", stage: "阶段 5：写论文" },
    ],
  };

    const pipelinesEn = {
    "cross-domain": [
      { title: "Deep-Read Papers", label: "Paper A (Source Domain)", stage: "Stage 1: Research Topics" },
      { title: "Deep-Read Papers", label: "Paper B (Target Domain)", stage: "Stage 1: Research Topics" },
      { title: "Assess Method Transfer", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Brainstorm Research Ideas", label: "Integration Plan", stage: "Stage 2: Conceive Ideas" },
      { title: "Extract Innovation Points", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Method Architecture", label: "", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    efficiency: [
      { title: "Deep-Read Papers", label: "Target Method", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "Efficiency Bottleneck Analysis", stage: "Stage 1: Research Topics" },
      { title: "Design Method Architecture", label: "Optimization Plan", stage: "Stage 3: Design Methods" },
      { title: "Design Loss Function & Optimization Strategy", label: "", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "Efficiency Comparison", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "Quality-Efficiency Tradeoff", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    workflow: [
      { title: "Deep-Read Papers", label: "Reference Paper", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "Existing Workflow Analysis", stage: "Stage 1: Research Topics" },
      { title: "Analyze Workflow Structure", label: "", stage: "Stage 3: Design Methods" },
      { title: "Design Multi-Stage System", label: "", stage: "Stage 3: Design Methods" },
      { title: "Assess Feasibility", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Method Architecture", label: "", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    robustness: [
      { title: "Deep-Read Papers", label: "Target Model", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "Security Risk Survey", stage: "Stage 1: Research Topics" },
      { title: "Design Failure Scenarios", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Assess Feasibility", label: "Defense Plan", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Method Architecture", label: "Safety Mechanism", stage: "Stage 3: Design Methods" },
      { title: "Design Evaluation Protocol", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Design Experiment Plan", label: "Attack & Defense Testing", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    theory: [
      { title: "Deep-Read Papers", label: "Core Paper", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "Design Space", stage: "Stage 1: Research Topics" },
      { title: "Brainstorm Research Ideas", label: "Hypothesis Proposal", stage: "Stage 2: Conceive Ideas" },
      { title: "Assess Feasibility", label: "Theoretical Verification", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Method Architecture", label: "Mechanism Analysis", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "Comparative Experiments", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Extract Innovation Points", label: "Design Principles", stage: "Stage 2: Conceive Ideas" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    "new-benchmark": [
      { title: "Deep-Read Papers", label: "Related Papers", stage: "Stage 1: Research Topics" },
      { title: "Analyze Existing Benchmarks", label: "", stage: "Stage 1: Research Topics" },
      { title: "Define Task", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Evaluation Protocol", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Build Data Pipeline", label: "Evaluation Data", stage: "Stage 3: Design Methods" },
      { title: "Assess Data Quality", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Design Experiment Plan", label: "Baseline Evaluation", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    system: [
      { title: "Deep-Read Papers", label: "Related Papers", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "System Requirements Analysis", stage: "Stage 1: Research Topics" },
      { title: "Analyze Workflow Structure", label: "System Architecture", stage: "Stage 3: Design Methods" },
      { title: "Design Multi-Stage System", label: "", stage: "Stage 3: Design Methods" },
      { title: "Design Method Architecture", label: "Component Integration", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "End-to-End Testing", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    dataset: [
      { title: "Deep-Read Papers", label: "Reference Paper", stage: "Stage 1: Research Topics" },
      { title: "Map Research Landscape", label: "Data Requirements Analysis", stage: "Stage 1: Research Topics" },
      { title: "Define Task", label: "", stage: "Stage 2: Conceive Ideas" },
      { title: "Build Data Pipeline", label: "", stage: "Stage 3: Design Methods" },
      { title: "Assess Data Quality", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Design Experiment Plan", label: "Data Validation", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
    metric: [
      { title: "Deep-Read Papers", label: "Related Papers", stage: "Stage 1: Research Topics" },
      { title: "Analyze Existing Benchmarks", label: "Existing Metrics Analysis", stage: "Stage 1: Research Topics" },
      { title: "Define Task", label: "Evaluation Dimensions", stage: "Stage 2: Conceive Ideas" },
      { title: "Assess Feasibility", label: "Metric Design", stage: "Stage 2: Conceive Ideas" },
      { title: "Design Evaluation Protocol", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Build Data Pipeline", label: "Evaluation Data", stage: "Stage 3: Design Methods" },
      { title: "Design Experiment Plan", label: "Human Evaluation", stage: "Stage 4: Run Experiments" },
      { title: "Analyze Experiment Results", label: "", stage: "Stage 4: Run Experiments" },
      { title: "Write Method Section", label: "", stage: "Stage 5: Write Paper" },
      { title: "Write Abstract", label: "", stage: "Stage 5: Write Paper" },
    ],
  };

    const pipelines = currentPromptLang === "en" ? pipelinesEn : pipelinesZh;

  const pipeline = pipelines[method];
  if (!pipeline) return;

  // Ensure all pipeline cards exist
  const existing = new Set();
  allItems.forEach((card) => { if (card && card.title) existing.add(card.title); });
  const seen = new Set();
  pipeline.forEach(({ title, stage }) => {
    if (existing.has(title) || seen.has(title)) return;
    seen.add(title);
    const category = stage;
    const prompt = currentPromptLang === "en"
      ? `# Role\nYou are a professional research assistant.\n\n# Task\nComplete the research task based on the title "${title}".\n\n# Input\n[Paste content to process here...]`
      : `# Role\n你是一位专业的研究助手。\n\n# Task\n请根据标题「${title}」完成相应的研究任务。\n\n# Input\n在此处粘贴需要处理的内容...`;
    const id = buildCustomCardId();
    state.customCards.push({ id, title, category, prompt, stageId: "" });
  });
  if (seen.size > 0) {
    commitState();
    refreshAllItems();
    CanvasApp.setAllItems(allItems);
  }

  CanvasApp.addPipeline(pipeline);
  };

  confirmCanvasSwitch((choice) => {
    if (choice === "cancel") return;
    applyMethod();
  });
}

function buildDrawerData() {
  const grouped = new Map();
  const stageOrder = [
    "阶段 1：调研选题", "阶段 2：构思 Idea", "阶段 3：设计方法",
    "阶段 4：执行实验", "阶段 5：写论文", "阶段 6：审稿修改", "阶段 7：准备投稿",
  ];

  // Map internal stage names to i18n keys
  const stageI18nMap = {
    "阶段 1：调研选题": "stage1",
    "阶段 2：构思 Idea": "stage2",
    "阶段 3：设计方法": "stage3",
    "阶段 4：执行实验": "stage4",
    "阶段 5：写论文": "stage5",
    "阶段 6：审稿修改": "stage6",
    "阶段 7：准备投稿": "stage7",
  };

  allItems.forEach((item) => {
    const cat = item.category || t("uncategorized");
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(item);
  });

  const ordered = [];
  stageOrder.forEach((cat) => {
    if (grouped.has(cat)) {
      const i18nKey = stageI18nMap[cat];
      const displayName = i18nKey ? t(i18nKey) : cat;
      ordered.push({ name: displayName, cards: grouped.get(cat) });
    }
  });
  grouped.forEach((cards, cat) => {
    if (!stageOrder.includes(cat)) {
      const customStage = state.customStages.find((s) => s.name === cat);
      if (!customStage) ordered.push({ name: cat, cards, stageId: null });
    }
  });
  // Include custom stages (even empty ones)
  const sorted = [...state.customStages].sort((a, b) => a.order - b.order);
  sorted.forEach((stage) => {
    ordered.push({ name: stage.name, cards: grouped.get(stage.name) || [], stageId: stage.id });
  });
  return ordered;
}

function buildTrashData() {
  const stageEntries = state.trashedStages.map((entry, index) => ({
    type: "stage",
    name: entry.stage.name,
    cardCount: entry.cards.length,
    trashIndex: index,
  }));
  const cardEntries = (state.trashedCards || []).map((entry, index) => ({
    type: "card",
    name: entry.card.title,
    trashIndex: index,
  }));
  return [...stageEntries, ...cardEntries];
}

function switchToLayout2() {
  document.querySelector(".bg-layer-a").classList.add("hidden");
  document.querySelector(".bg-layer-b").classList.add("hidden");
  document.querySelector(".floating-actions").classList.add("hidden");
  layout2El.classList.remove("hidden");

  const ordered = buildDrawerData();
  const trashData = buildTrashData();
  CanvasApp.setAllItems(allItems);
  CanvasApp.setTitleMap(CARD_TITLE_MAP);
  CanvasApp.init(ordered, handleDrawerReorder, handleDrawerAddCard, handleDrawerAddStage, handleDrawerDeleteStage, trashData, handleDrawerRestoreStage, handleDrawerEmptyTrash, handleDrawerRenameStage, handleDrawerRenameCard, handleDrawerDeleteCard, handleDrawerMoveCardToStage);
}

function handleDrawerAddCard(stageKey) {
  pendingStageId = stageKey;
  addModal.classList.remove("hidden");
  metaNeedInput.focus();
}

function handleDrawerAddStage() {
  addCustomStage("未命名");
}

function handleDrawerDeleteStage(stageId) {
  deleteCustomStage(stageId);
}

function handleDrawerRenameStage(stageId, newName) {
  renameCustomStage(stageId, newName);
}

function handleDrawerRenameCard(cardId, newTitle) {
  const item = allItems.find((c) => c.id === cardId);
  if (!item) return;
  updateCard(cardId, newTitle, item.prompt || "");
  refreshAllItems();
}

function handleDrawerDeleteCard(cardId) {
  deleteCustomCard(cardId);
}

function handleDrawerMoveCardToStage(cardId, newStageId) {
  const card = state.customCards.find((c) => c.id === cardId);
  if (!card) return;
  if (newStageId.startsWith("builtin:")) {
    card.stageId = "";
    card.category = newStageId.slice(8);
  } else {
    const stage = state.customStages.find((s) => s.id === newStageId);
    if (!stage) return;
    card.stageId = newStageId;
    card.category = stage.name;
  }
  commitState();
}

function handleDrawerRestoreStage(type, trashIndex) {
  if (type === "card") {
    restoreTrashedCard(trashIndex);
  } else {
    restoreTrashedStage(trashIndex);
  }
}

function handleDrawerEmptyTrash() {
  emptyTrash();
}

function handleDrawerReorder(draggedId, targetId) {
  const sorted = [...state.customStages].sort((a, b) => a.order - b.order);
  const fromIdx = sorted.findIndex((s) => s.id === draggedId);
  const toIdx = sorted.findIndex((s) => s.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = sorted.splice(fromIdx, 1);
  sorted.splice(toIdx, 0, moved);
  sorted.forEach((s, i) => { s.order = i; });
  state.customStages = sorted;
  commitState();
}

function parseGeneratedSkill(rawText) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim());
  const nonEmpty = lines.filter(Boolean);
  if (nonEmpty.length < 2) {
    return null;
  }
  let title = nonEmpty[0]
    .replace(/^#+\s*/, "")
    .replace(/^标题[:：]\s*/i, "")
    .trim();
  const prompt = nonEmpty.slice(1).join("\n").trim();
  if (!title || !prompt) {
    return null;
  }
  return { title, prompt };
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addModal && !addModal.classList.contains("hidden")) {
    closeAddPanel();
  }
});

function bindDragEvents(node, cardId) {
  node.addEventListener("dragstart", (event) => {
    draggingId = cardId;
    node.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", cardId);
  });

  node.addEventListener("dragend", () => {
    draggingId = null;
    node.classList.remove("dragging");
    clearDragState();
  });

  node.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (draggingId === cardId) {
      return;
    }
    node.classList.add("drag-over");
  });

  node.addEventListener("dragleave", () => {
    node.classList.remove("drag-over");
  });

  node.addEventListener("drop", (event) => {
    event.preventDefault();
    node.classList.remove("drag-over");
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === cardId) {
      return;
    }
    reorderCommon(sourceId, cardId);
  });
}

function clearDragState() {
  commonRoot.querySelectorAll(".card.drag-over").forEach((node) => {
    node.classList.remove("drag-over");
  });
}

function reorderCommon(sourceId, targetId) {
  const arr = [...state.commonIds];
  const sourceIndex = arr.indexOf(sourceId);
  const targetIndex = arr.indexOf(targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }
  const [moved] = arr.splice(sourceIndex, 1);
  const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  arr.splice(insertIndex, 0, moved);
  state.commonIds = arr;
  commitState();
}

function moveCommonToEnd(cardId) {
  const arr = state.commonIds.filter((id) => id !== cardId);
  arr.push(cardId);
  state.commonIds = arr;
  commitState();
}

function addToCommon(cardId) {
  if (state.commonIds.includes(cardId)) {
    return;
  }
  state.commonIds = [...state.commonIds, cardId];
  commitState();
}

function removeFromCommon(cardId) {
  state.commonIds = state.commonIds.filter((id) => id !== cardId);
  commitState();
}

function addNewCard(title, prompt) {
  const id = buildCustomCardId();
  let category = "未分类";
  let stageId = "";

  if (pendingStageId.startsWith("builtin:")) {
    category = pendingStageId.slice(8);
  } else if (pendingStageId) {
    const stage = state.customStages.find((s) => s.id === pendingStageId);
    category = stage ? stage.name : "未分类";
    stageId = pendingStageId;
  }

  state.customCards.push({ id, title, category, prompt, stageId });
  pendingStageId = "";
  commitState();
}

function updateCard(cardId, newTitle, newPrompt) {
  const item = allItems.find((card) => card.id === cardId);
  if (!item) {
    return;
  }

  if (item.source === "custom") {
    state.customCards = state.customCards.map((card) =>
      card.id === cardId ? { ...card, title: newTitle, prompt: newPrompt } : card
    );
  } else {
    state.editedCards[cardId] = {
      title: newTitle,
      prompt: newPrompt,
    };
  }
  commitState();
}

function deleteCard(cardId) {
  const item = allItems.find((card) => card.id === cardId);
  if (!item) {
    return;
  }

  if (item.source === "custom") {
    state.customCards = state.customCards.filter((card) => card.id !== cardId);
  } else {
    if (!state.deletedCardIds.includes(cardId)) {
      state.deletedCardIds.push(cardId);
    }
  }

  delete state.editedCards[cardId];
  state.commonIds = state.commonIds.filter((id) => id !== cardId);
  inputStore.delete(cardId);
  commitState();
}

function buildCustomCardId() {
  const existing = new Set(allItems.map((item) => item.id));
  let id = "";
  do {
    id = `custom-${Math.random().toString(36).slice(2, 9)}`;
  } while (existing.has(id));
  return id;
}

function commitState(options = {}) {
  refreshAllItems();
  saveState();
  render(options);
  // Rebuild layout 2 drawer if visible
  if (layout2El && !layout2El.classList.contains("hidden")) {
    CanvasApp.setAllItems(allItems);
    CanvasApp.setTitleMap(CARD_TITLE_MAP);
    CanvasApp.init(buildDrawerData(), handleDrawerReorder, handleDrawerAddCard, handleDrawerAddStage, handleDrawerDeleteStage, buildTrashData(), handleDrawerRestoreStage, handleDrawerEmptyTrash, handleDrawerRenameStage, handleDrawerRenameCard, handleDrawerDeleteCard, handleDrawerMoveCardToStage);
  }
}

function refreshAllItems() {
  allItems = materializeItems(baseItems, state);
}

function materializeItems(base, currentState) {
  const deleted = new Set(currentState.deletedCardIds);
  const edited = currentState.editedCards || {};
  const seen = new Set();
  const output = [];

  base.forEach((item) => {
    if (deleted.has(item.id)) {
      return;
    }
    const patch = edited[item.id];
    const next = {
      id: item.id,
      title: patch && typeof patch.title === "string" ? patch.title : item.title,
      category: item.category || "未分类",
      prompt: patch && typeof patch.prompt === "string" ? patch.prompt : item.prompt,
      source: "base",
    };
    if (!next.title || !next.prompt || seen.has(next.id)) {
      return;
    }
    seen.add(next.id);
    output.push(next);
  });

  currentState.customCards.forEach((item) => {
    if (!item || !item.id || !item.title || !item.prompt) {
      return;
    }
    if (seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    output.push({
      id: item.id,
      title: item.title,
      category: item.category || "未分类",
      prompt: item.prompt,
      source: "custom",
    });
  });

  return output;
}

function normalizeCommonIds(ids, items) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }
  const validSet = new Set(items.map((item) => item.id));
  const normalized = [];
  ids.forEach((id) => {
    if (validSet.has(id) && !normalized.includes(id)) {
      normalized.push(id);
    }
  });
  return normalized;
}

function buildDefaultCommonIds(items) {
  if (DEFAULT_COMMON_TITLES.length === 0) {
    return [];
  }
  const byTitle = new Map(items.map((item) => [item.title, item.id]));
  const selected = [];

  DEFAULT_COMMON_TITLES.forEach((title) => {
    const id = byTitle.get(title);
    if (id && !selected.includes(id)) {
      selected.push(id);
    }
  });

  const fallback = items.map((item) => item.id).filter((id) => !selected.includes(id));
  while (selected.length < Math.min(4, items.length) && fallback.length > 0) {
    selected.push(fallback.shift());
  }

  return selected;
}

function createDefaultState() {
  return {
    commonIds: [],
    customCards: [],
    customStages: [],
    trashedStages: [],
    trashedCards: [],
    editedCards: {},
    deletedCardIds: [],
    userCardsSeeded: false,
    canvasName: t("newLayout"),
  };
}

function seedDefaultUserCards() {
  if (state.userCardsSeeded) {
    // Reset if state was corrupted (seeded but no cards and no stages)
    if (state.customCards.length === 0 && state.customStages.length === 0) {
      state.userCardsSeeded = false;
      // Fall through to re-seed below
    }
  }
  if (state.userCardsSeeded) {
    // Migrate old cards without stageId into a new stage
    const orphanCards = state.customCards.filter((c) => !c.stageId);
    if (orphanCards.length > 0) {
      const stageId = state.customStages.length > 0
        ? state.customStages[0].id
        : (() => {
            const id = "stage-" + Math.random().toString(36).slice(2, 9);
            state.customStages.push({ id, name: "我的工具箱", order: 0 });
            return id;
          })();
      orphanCards.forEach((c) => { c.stageId = stageId; c.category = state.customStages.find(s => s.id === stageId)?.name || "我的工具箱"; });
      saveState();
    }
    return;
  }
  const stageId = "stage-" + Math.random().toString(36).slice(2, 9);
  state.customStages.push({ id: stageId, name: "我的工具箱", order: 0 });
  DEFAULT_USER_CARDS.forEach((card) => {
    const id = buildCustomCardId();
    state.customCards.push({
      id,
      title: card.title,
      category: "我的工具箱",
      prompt: card.prompt,
      stageId,
    });
  });
  state.userCardsSeeded = true;
  saveState();
}

function addCustomStage(name) {
  const id = "stage-" + Math.random().toString(36).slice(2, 9);
  state.customStages.push({ id, name: name || "新阶段", order: state.customStages.length });
  commitState();
  return id;
}

function renameCustomStage(stageId, newName) {
  const stage = state.customStages.find((s) => s.id === stageId);
  if (!stage) return;
  stage.name = newName;
  // Update category of all cards in this stage
  state.customCards.forEach((c) => { if (c.stageId === stageId) c.category = newName; });
  commitState();
}

function deleteCustomStage(stageId) {
  const stage = state.customStages.find((s) => s.id === stageId);
  if (!stage) return;
  const cards = state.customCards.filter((c) => c.stageId === stageId);
  state.trashedStages.push({ stage: { ...stage }, cards: cards.map((c) => ({ ...c })) });
  state.customStages = state.customStages.filter((s) => s.id !== stageId);
  state.customCards = state.customCards.filter((c) => c.stageId !== stageId);
  cards.forEach((c) => {
    state.commonIds = state.commonIds.filter((cid) => cid !== c.id);
    inputStore.delete(c.id);
  });
  commitState();
}

function deleteCustomCard(cardId) {
  const card = state.customCards.find((c) => c.id === cardId);
  if (!card) return;
  if (!state.trashedCards) state.trashedCards = [];
  state.trashedCards.push({ card: { ...card } });
  state.customCards = state.customCards.filter((c) => c.id !== cardId);
  state.commonIds = state.commonIds.filter((cid) => cid !== cardId);
  inputStore.delete(cardId);
  commitState();
}

function restoreTrashedStage(trashIndex) {
  if (trashIndex < 0 || trashIndex >= state.trashedStages.length) return;
  const entry = state.trashedStages[trashIndex];
  const stage = entry.stage;
  const cards = entry.cards;
  // Restore stage
  if (!state.customStages.find((s) => s.id === stage.id)) {
    stage.order = state.customStages.length;
    state.customStages.push({ ...stage });
  }
  // Restore cards
  cards.forEach((c) => {
    if (!state.customCards.find((cc) => cc.id === c.id)) {
      state.customCards.push({ ...c });
    }
  });
  state.trashedStages.splice(trashIndex, 1);
  commitState();
}

function restoreTrashedCard(trashIndex) {
  if (!state.trashedCards || trashIndex < 0 || trashIndex >= state.trashedCards.length) return;
  const entry = state.trashedCards[trashIndex];
  const card = entry.card;
  // Check if the original stage still exists
  const stageExists = state.customStages.some((s) => s.id === card.stageId);
  if (!stageExists) {
    // Find or create "未分类" stage
    let uncategorized = state.customStages.find((s) => s.name === t("uncategorized"));
    if (!uncategorized) {
      uncategorized = { id: "stage-" + Math.random().toString(36).slice(2, 9), name: t("uncategorized"), order: state.customStages.length };
      state.customStages.push(uncategorized);
    }
    card.stageId = uncategorized.id;
    card.category = uncategorized.name;
  }
  if (!state.customCards.find((cc) => cc.id === card.id)) {
    state.customCards.push({ ...card });
    state.commonIds.push(card.id);
  }
  state.trashedCards.splice(trashIndex, 1);
  commitState();
}

function emptyTrash() {
  state.trashedStages = [];
  state.trashedCards = [];
  commitState();
}

function reorderCustomStage(stageId, direction) {
  const sorted = [...state.customStages].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === stageId);
  if (idx === -1) return;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= sorted.length) return;
  const tmpOrder = sorted[idx].order;
  sorted[idx].order = sorted[target].order;
  sorted[target].order = tmpOrder;
  state.customStages = sorted;
  commitState();
}

function normalizeState(raw) {
  const next = createDefaultState();
  if (!raw || typeof raw !== "object") {
    return next;
  }

  if (Array.isArray(raw.commonIds)) {
    next.commonIds = raw.commonIds.filter((id) => typeof id === "string");
  }
  if (Array.isArray(raw.customCards)) {
    next.customCards = raw.customCards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({
        id: String(card.id || "").trim(),
        title: String(card.title || "").trim(),
        category: String(card.category || "").trim() || "未分类",
        prompt: String(card.prompt || "").trim(),
        stageId: card.stageId ? String(card.stageId).trim() : "",
      }))
      .filter((card) => card.id && card.title && card.prompt);
    // Preserve cards without stageId for migration in seedDefaultUserCards
  }
  if (Array.isArray(raw.customStages)) {
    next.customStages = raw.customStages
      .filter((s) => s && typeof s === "object")
      .map((s, i) => ({
        id: String(s.id || "").trim(),
        name: String(s.name || "").trim() || "自定义阶段",
        order: typeof s.order === "number" ? s.order : i,
      }))
      .filter((s) => s.id && s.name);
  }
  if (Array.isArray(raw.trashedStages)) {
    next.trashedStages = raw.trashedStages
      .filter((t) => t && typeof t === "object" && t.stage)
      .map((t) => ({
        stage: {
          id: String(t.stage.id || "").trim(),
          name: String(t.stage.name || "").trim() || "自定义阶段",
          order: typeof t.stage.order === "number" ? t.stage.order : 0,
        },
        cards: Array.isArray(t.cards) ? t.cards
          .filter((c) => c && typeof c === "object")
          .map((c) => ({
            id: String(c.id || "").trim(),
            title: String(c.title || "").trim(),
            category: String(c.category || "").trim() || "未分类",
            prompt: String(c.prompt || "").trim(),
            stageId: String(c.stageId || "").trim(),
          }))
          .filter((c) => c.id && c.title && c.prompt) : [],
      }))
      .filter((t) => t.stage.id);
  }
  if (Array.isArray(raw.trashedCards)) {
    next.trashedCards = raw.trashedCards
      .filter((t) => t && typeof t === "object" && t.card)
      .map((t) => ({
        card: {
          id: String(t.card.id || "").trim(),
          title: String(t.card.title || "").trim(),
          category: String(t.card.category || "").trim() || "未分类",
          prompt: String(t.card.prompt || "").trim(),
          stageId: String(t.card.stageId || "").trim(),
        },
      }))
      .filter((t) => t.card.id && t.card.title);
  }
  if (typeof raw.userCardsSeeded === "boolean") {
    next.userCardsSeeded = raw.userCardsSeeded;
  }
  if (raw.editedCards && typeof raw.editedCards === "object") {
    Object.keys(raw.editedCards).forEach((id) => {
      const patch = raw.editedCards[id];
      if (!patch || typeof patch !== "object") {
        return;
      }
      const title = String(patch.title || "").trim();
      const prompt = String(patch.prompt || "").trim();
      if (!title || !prompt) {
        return;
      }
      next.editedCards[id] = { title, prompt };
    });
  }
  if (Array.isArray(raw.deletedCardIds)) {
    next.deletedCardIds = raw.deletedCardIds.filter((id) => typeof id === "string");
  }
  if (typeof raw.canvasName === "string" && raw.canvasName.trim()) {
    next.canvasName = raw.canvasName.trim();
  }

  return next;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    return JSON.parse(raw);
  } catch (error) {
    return createDefaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    // Ignore persistence failures.
  }
}

function mergePromptAndInput(promptTemplate, inputText) {
  const template = (promptTemplate || "").trim();
  const userText = (inputText || "").trim();
  if (!userText) {
    return template;
  }

  const placeholderRegex = /\[在此处粘贴[^\]]*\]/g;
  if (placeholderRegex.test(template)) {
    return template.replace(placeholderRegex, userText);
  }

  return `${template}\n\n${userText}`;
}

async function fetchPageText(url) {
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const article = doc.querySelector("article") || doc.querySelector(".ltx_page_main") || doc.body;
  if (!article) throw new Error("无法解析网页内容");
  article.querySelectorAll("script,style,nav,footer,header,aside,noscript,iframe").forEach((el) => el.remove());
  let text = article.innerText || article.textContent || "";
  text = text.replace(/\n\s*\n/g, "\n\n").trim();
  if (text.length > 15000) text = text.slice(0, 15000) + "\n...(内容已截断)";
  return text;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) {
    throw new Error("copy failed");
  }
}

function stateToMarkdown(state) {
  const nodes = state.nodes || [];
  const edges = state.edges || [];
  if (nodes.length === 0) return "# 杂交水论\n\n(空画布)";

  // Build card lookup
  const cardMap = new Map();
  allItems.forEach((item) => { if (item && item.id) cardMap.set(item.id, item); });

  // Topological sort by edges
  const childrenOf = new Map();
  const parentCount = new Map();
  nodes.forEach((n) => { childrenOf.set(n.id, []); parentCount.set(n.id, 0); });
  edges.forEach((e) => {
    if (childrenOf.has(e.from) && parentCount.has(e.to)) {
      childrenOf.get(e.from).push(e.to);
      parentCount.set(e.to, parentCount.get(e.to) + 1);
    }
  });
  const queue = [];
  const order = [];
  nodes.forEach((n) => { if (parentCount.get(n.id) === 0) queue.push(n.id); });
  while (queue.length > 0) {
    const cur = queue.shift();
    order.push(cur);
    for (const childId of (childrenOf.get(cur) || [])) {
      parentCount.set(childId, parentCount.get(childId) - 1);
      if (parentCount.get(childId) === 0) queue.push(childId);
    }
  }
  nodes.forEach((n) => { if (!order.includes(n.id)) order.push(n.id); });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  let md = `# 杂交水论\n\n> ${dateStr}\n\n---\n\n`;

  order.forEach((nodeId, idx) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const card = cardMap.get(node.cardId);
    const title = card ? card.title : node.cardId;
    const subtitle = node.subtitle || "";
    const output = (node.outputValue || "").trim();

    md += `## ${idx + 1}. ${title}\n\n`;
    if (subtitle) md += `> ${subtitle}\n\n`;
    if (output) {
      md += `${output}\n\n`;
    }
    md += `---\n\n`;
  });

  return md;
}

function setStatus(element, text, stateClass) {
  element.textContent = text;
  element.classList.remove("success", "error");
  if (stateClass) {
    element.classList.add(stateClass);
  }
}

function showNotice(text) {
  noticeText.textContent = text;
  notice.classList.remove("hidden");
}

function hideNotice() {
  notice.classList.add("hidden");
  manualLoadBtn.classList.add("hidden");
}
