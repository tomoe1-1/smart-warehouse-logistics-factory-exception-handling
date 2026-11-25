module.exports=[48509,a=>{"use strict";var b=a.i(68878),c=a.i(81926),d=a.i(40905);function e(a,b){return a.trim().replace(/[^a-zA-Z0-9_]/g,"")||b}function f(a){let b=String(a??"");return(/^[=+\-@\t\r]/.test(b)&&(b=`'${b}`),/[",\n\r]/.test(b))?`"${b.replace(/"/g,'""')}"`:b}a.s(["t",0,function(a,b="http://127.0.0.1:4721"){let c=d.B[a.system],f="mes"===a.system?"downtime":"field"===a.system?"congestion":"stockout";if("table"===a.mode){let b=e(a.dbName,"warehouse_bridge"),d=e(a.inboundTable,`${a.system}_anomaly_in`),f="field"===a.system?"":e(a.writebackTable,`${a.system}_command_out`);if("mysql"===a.dbType){let e=[`-- ${c} 中间表对接建表脚本（MySQL 8.0+）`,`CREATE DATABASE IF NOT EXISTS \`${b}\` DEFAULT CHARACTER SET utf8mb4;`,`USE \`${b}\`;`,"",`-- 1. 异常信号接入表（由 ${c} 写入，异常调度软件层读取）`,`CREATE TABLE IF NOT EXISTS \`${d}\` (`,"  `id` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '事件唯一主键（防重）',","  `anomaly_type` VARCHAR(32) NOT NULL COMMENT 'stockout | downtime | congestion | wrong_order',",`  \`event_type\` VARCHAR(64) NOT NULL DEFAULT '${a.system}.table' COMMENT '原始事件码',`,"  `title` VARCHAR(160) NOT NULL COMMENT '异常标题',","  `summary` VARCHAR(500) NOT NULL COMMENT '现场摘要说明',","  `location` VARCHAR(120) NOT NULL COMMENT '库区/巷道/工位位置',","  `external_ref` VARCHAR(64) NOT NULL COMMENT '关联单号或设备号',","  `linked_orders` VARCHAR(255) DEFAULT '' COMMENT '受影响订单号，逗号分隔',","  `payload_json` JSON DEFAULT NULL COMMENT '扩展原始字段 JSON',","  `sync_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=待拉取, 1=已接入, 2=已忽略',","  `occurred_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,",`  INDEX \`idx_${d}_sync\` (\`sync_status\`, \`occurred_at\`)`,") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"];return f&&e.push("",`-- 2. 处置指令回写表（由异常调度软件层人工确认后写入，${c} 消费）`,`CREATE TABLE IF NOT EXISTS \`${f}\` (`,"  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,","  `anomaly_id` VARCHAR(32) NOT NULL COMMENT '异常单号（如 AN-24051）',","  `action` VARCHAR(64) NOT NULL COMMENT '回写动作码（如 task.create / task.complete）',","  `summary` VARCHAR(255) NOT NULL COMMENT '动作说明',","  `payload_json` JSON NOT NULL COMMENT '处理人、设备、库位及结论明细',","  `ack_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=待原系统消费, 1=已执毕, 9=拒绝',",`  \`external_id\` VARCHAR(64) DEFAULT NULL COMMENT '${c} 回填的外部单号',`,"  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,",`  INDEX \`idx_${f}_ack\` (\`ack_status\`, \`created_at\`)`,") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"),{title:`${c} MySQL 中间表 DDL`,language:"sql",code:e.join("\n"),note:"已内置 MySQL 直连驱动：保存配置后软件会直接按表名执行 SELECT 拉取（sync_status=0 → 1）并在确认下发/关闭时直接 INSERT 回写表。",filename:`${a.system}-mysql-bridge.sql`}}let g=[`-- ${c} 中间表对接建表脚本（SQL Server 2016+）`,`-- 目标库：[${b}]`,`IF OBJECT_ID(N'[dbo].[${d}]', N'U') IS NULL`,`CREATE TABLE [dbo].[${d}] (`,"  id NVARCHAR(64) NOT NULL PRIMARY KEY,","  anomaly_type NVARCHAR(32) NOT NULL, -- stockout | downtime | congestion | wrong_order",`  event_type NVARCHAR(64) NOT NULL DEFAULT '${a.system}.table',`,"  title NVARCHAR(160) NOT NULL,","  summary NVARCHAR(500) NOT NULL,","  location NVARCHAR(120) NOT NULL,","  external_ref NVARCHAR(64) NOT NULL,","  linked_orders NVARCHAR(255) NULL,","  payload_json NVARCHAR(MAX) NULL,","  sync_status TINYINT NOT NULL DEFAULT 0, -- 0=待拉取, 1=已接入, 2=已忽略","  occurred_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()",");"];return f&&g.push("",`IF OBJECT_ID(N'[dbo].[${f}]', N'U') IS NULL`,`CREATE TABLE [dbo].[${f}] (`,"  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,","  anomaly_id NVARCHAR(32) NOT NULL,","  action NVARCHAR(64) NOT NULL,","  summary NVARCHAR(255) NOT NULL,","  payload_json NVARCHAR(MAX) NOT NULL,","  ack_status TINYINT NOT NULL DEFAULT 0, -- 0=待消费, 1=已接受, 9=拒绝","  external_id NVARCHAR(64) NULL,","  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()",");"),{title:`${c} SQL Server 中间表 DDL`,language:"sql",code:g.join("\n"),note:"已内置 SQL Server (TDS) 直连驱动：保存配置后软件会直接按表名执行 SELECT 拉取（sync_status=0 → 1）并在确认下发/关闭时直接 INSERT 回写表。",filename:`${a.system}-sqlserver-bridge.sql`}}if("webhook"===a.mode){let g=a.webhookPath.startsWith("/")?a.webhookPath:`/${a.webhookPath}`,h=a.webhookSecret?` \\
  -H "x-webhook-secret: <已配置的校验口令>"`:"",i=`curl -X POST "${b}${g}" \\
  -H "Content-Type: application/json"${h} \\
  -d '{
    "id": "EVT-${a.system.toUpperCase()}-001",
    "anomalyType": "${f}",
    "eventType": "${a.system}.push",
    "title": "${c} 异常推送示例",
    "summary": "现场检测到异常，请核对后进入闭环",
    "location": "${"downtime"===f?"穿梭库 · 提升机 PL-1":"congestion"===f?"出库接驳口 H-OUT":"出库 U 型站 · 料箱库 1 巷"}",
    "externalRef": "SO-24099",
    "linkedOrderIds": ["SO-24099"]
  }'`;if("field"!==a.system&&"api"===a.webhookWriteback){let b=(0,d.j)(a.baseUrl||"https://example.internal",a.writebackPath||"/anomalies/writeback");return{title:`${c} Webhook 推入 + HTTP 回写混合契约`,language:"bash",code:["# 1. 入站推送（对方调用我方 Webhook）",i,"",`# 2. 出站回写（人工确认下发/关闭后，我方 POST 调用对方接口 ${b}）`,'{\n  "anomalyId": "AN-24051",',`  "action": "${"mes"===a.system?"maintenance.create":"task.create"}",`,'  "summary": "工单回写说明",\n  "payload": { "assignee": "周岚", "equipment": "料箱穿梭车 TB-1", "location": "..." }\n}'].join("\n"),note:"跨机接收推送请双击根目录「启动-局域网联调版.bat」启动；确认调度或关闭后会自动向所填 HTTP 接口发起回写。"}}if("field"!==a.system&&"table"===a.webhookWriteback){let b=e(a.dbName,"warehouse_bridge"),d=e(a.writebackTable,`${a.system}_command_out`),f="mysql"===a.dbType?`-- 回写目标库：\`${b}\`（MySQL 8.0+）
CREATE TABLE IF NOT EXISTS \`${d}\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`anomaly_id\` VARCHAR(32) NOT NULL COMMENT '异常单号',
  \`action\` VARCHAR(64) NOT NULL COMMENT '回写动作码',
  \`summary\` VARCHAR(255) NOT NULL COMMENT '动作说明',
  \`payload_json\` JSON NOT NULL COMMENT '处理人、设备、库位及结论明细',
  \`ack_status\` TINYINT NOT NULL DEFAULT 0 COMMENT '0=待原系统消费, 1=已执毕, 9=拒绝',
  \`external_id\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`:`-- 回写目标库：[${b}]（SQL Server 2016+）
IF OBJECT_ID(N'[dbo].[${d}]', N'U') IS NULL
CREATE TABLE [dbo].[${d}] (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  anomaly_id NVARCHAR(32) NOT NULL,
  action NVARCHAR(64) NOT NULL,
  summary NVARCHAR(255) NOT NULL,
  payload_json NVARCHAR(MAX) NOT NULL,
  ack_status TINYINT NOT NULL DEFAULT 0,
  external_id NVARCHAR(64) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);`;return{title:`${c} Webhook 推入 + 数据库回写混合契约（含 DDL）`,language:"sql",code:`/* 1. 对方推送调用示例：
${i}
*/

-- 2. 处置指令数据库回写表建表脚本
${f}`,note:"跨机接收推送请运行根目录「启动-局域网联调版.bat」；可下载本脚本在客户库创建回写表，软件确认操作后直接 INSERT 写入。",filename:`${a.system}-webhook-outbox-${a.dbType}.sql`}}return{title:`${c} Webhook 推送调用示例`,language:"bash",code:i,note:"若需接收局域网其他服务器推送，请运行根目录「启动-局域网联调版.bat」开放局域网端口。"}}if("api"===a.mode){let b=(0,d.j)(a.baseUrl||"https://example.internal",a.pullPath||"/anomalies/pull"),e="field"===a.system?"（现场信号不回写）":(0,d.j)(a.baseUrl||"https://example.internal",a.writebackPath||"/anomalies/writeback"),g=`// 1. 拉取接口 GET ${b}
// 期望返回 200 JSON：
{
  "events": [
    {
      "id": "EVT-9001",
      "anomalyType": "${f}",
      "title": "${c} 异常标题",
      "summary": "异常描述摘要",
      "location": "出库 U 型站 \xb7 料箱库 1 巷",
      "externalRef": "SO-9001",
      "linkedOrderIds": ["SO-9001"]
    }
  ]
}

// 2. 回写接口 POST ${e}
// 请求体 JSON（期望返回 200 {"ok": true, "externalId": "EXT-1001"}）：
{
  "anomalyId": "AN-24051",
  "action": "${"mes"===a.system?"maintenance.create":"task.create"}",
  "summary": "工单回写说明",
  "payload": { "assignee": "周岚", "equipment": "料箱穿梭车 TB-1", "location": "..." }
}`;return{title:`${c} HTTP 接口契约格式`,language:"json",code:g,note:"回写若返回非 2xx 或连接超时，软件层会将本次动作记为「拒绝」并保持在当前步骤，不会虚报成功。"}}return{title:`${c} 当前为演示样本模式`,language:"text",code:"当前使用内置模拟样本运行，不发起外部网络请求。切换到「接口对接 / 对方推送 / 中间表」即可查看对应技术契约。",note:"适合前期流程走查与集成商方案对齐。"}},"P",0,function(a,d){let e=a.anomalies.map(a=>{let d=a.diagnosis?.priority??a.proposal?.priority??b.a[a.type].priority,e=a.closeRecord?a.closeRecord.onTime?"及时":"超时":"在途/未关闭";return[a.id,b.a[a.type].label,`${d} ${b.T[d]}`,a.title,a.location,a.externalRef,a.linkedOrderIds.join("、")||"无",(0,b.W)(a.currentStep).name,a.closeRecord?a.closeRecord.simMinutes:a.simMinutes,a.slaMinutes,e,a.skillId?`是(${a.skillId})`:"否",(0,c.r)(a.discoveredAt),a.closeRecord?(0,c.r)(a.closeRecord.closedAt):"—"].map(f)}),g=[[],["汇总指标","数值","说明"].map(f),["已关闭异常数",d.closedCount,`共接入 ${a.anomalies.length} 条`].map(f),["平均关闭时长(分钟)",(0,c.H)(d.avgMinutes),"已关闭异常模拟作业时长均值"].map(f),["人工介入总次数",d.interventionCount,"初判、调度、途中处置、关闭、技能沉淀与关联核对"].map(f),["关联订单及时率",0===d.orderTotal?"—":`${d.onTime}/${d.orderTotal} (${(0,c.Z)(d.onTime,d.orderTotal)})`,"按订单号去重统计"].map(f),["已沉淀组织技能数",a.skills.length,"可在后续同类异常初判时引用"].map(f)];return"\uFEFF"+[["异常单号","类型","优先级","标题","位置","外部单号","关联订单","当前步骤","模拟耗时(分钟)","约定时限(分钟)","是否及时","是否已沉淀技能","发现时间","关闭时间"].map(f),...e,...g].map(a=>a.join(",")).join("\r\n")},"J",0,function(a,d,e){let f=[`# ${e?`${e} \xb7 `:""}仓储异常调度试点运行报告`,"",`- 生成时间：${new Date().toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"})}`,`- 本期纳入范围：${a.rules.enabledTypes.map(c=>`${b.a[c].label}（时限 ${a.rules.slaMinutes[c]} 分钟）`).join("、")}`,"","## 一、核心指标概览","","| 指标项 | 当前数值 | 口径说明 |","| --- | --- | --- |",`| 异常关闭平均时长 | ${(0,c.H)(d.avgMinutes)} 分钟 | 已关闭 ${d.closedCount} 单均值 |`,`| 人工介入次数 | ${d.interventionCount} 次 | ${d.interventionsByStep.map(a=>`${a.name} ${a.count} 次`).join("、")||"暂无"} |`,`| 关联订单及时率 | ${0===d.orderTotal?"—":`${d.onTime}/${d.orderTotal}（${(0,c.Z)(d.onTime,d.orderTotal)}）`} | 独立订单去重统计 |`,`| 沉淀组织技能 | ${a.skills.length} 条 | 累计复用 ${a.skills.reduce((a,b)=>a+b.reuseCount,0)} 次 |`,"",`## 二、异常单据明细（共 ${a.anomalies.length} 条）`,"","| 单号 | 类型 | 当前步骤 | 耗时/时限 | 状态 | 标题 |","| --- | --- | --- | --- | --- | --- |",...a.anomalies.map(a=>{let c=a.closeRecord?a.closeRecord.onTime?"已关闭·及时":"已关闭·超时":"处理中";return`| ${a.id} | ${b.a[a.type].label} | ${(0,b.W)(a.currentStep).name} | ${a.simMinutes}/${a.slaMinutes} 分钟 | ${c} | ${a.title.replace(/\|/g,"｜")} |`})];return a.skills.length>0&&f.push("","## 三、已沉淀组织技能","",...a.skills.map(a=>`- **${a.id} ${a.name}**（${b.a[a.anomalyType].label}，已复用 ${a.reuseCount} 次）：${a.suggestion}`)),f.join("\n")}])}];

//# sourceMappingURL=lib_integration-contract_ts_07bvikp1szx4t._.js.map