给 Agent 设计 CLI 的十个原则
昨天我们聊到钉钉和飞书集体 CLI 化，见：钉钉飞书集体抛弃 MCP，CLI 才是 Agent 的终局

你可能会想：我的产品，是否也需要做个 CLI？

以及，怎么做呢？

首先，你需要想清楚一个问题：你的产品，到底是给人用的，还是给 Agent 用的？你来做你的判断，我就不劝退和不在这里展开了。

而 Agent，正在成为软件的主要用户。它不点按钮、不填表单、不看界面。它说的是命令行的语言。把你的产品能力暴露为 CLI，很可能已经不是可选项了。

我们知道，给人用的产品，需要好的 GUI、好的交互设计、好的视觉体验。那么问题来了：

给 Agent 用的 CLI 的交互设计，怎么做才更好呢？

要知道，传统的 CLI 设计规范，是给人类设计的。而 Agent 则有完全不同的认知特点和失败模式。

于是，我调研分析了 POSIX 标准、GNU 编码规范、clig.dev 社区指南、Anthropic 的 tool use 文档、Berkeley 的最新研究、Lightning Labs 在 lnget 项目中提出的 agent-CLI 设计轴，再加上我自己用 CLI + Skill 操控各种服务的实战经验，总结出 10 条面向 Agent 的 CLI 设计原则。

如果你想将自己的产品 CLI 化，能给 Agent 好的使用体验，可以看看。

01
Agent 怎么想的
在讲设计原则之前，得先理解 Agent 是怎么「想」的。

LLM 的训练数据里有大量 shell 命令和 bash 脚本，分布在 GitHub 代码（约占训练数据的 5%）、Stack Overflow 问答（约 2%）、以及各种技术博客和文档中。所以 Agent 天生就对命令行有相当的「直觉」。

但这个直觉有边界。

Berkeley 最新的 Function Calling Leaderboard（BFCL V4）显示，即使是排名第一的模型，在复杂的多步工具调用场景下，准确率也达不到 100%。SWE-bench 的数据更直观：当前最强的前沿模型，也只能解决大约七成左右的编码任务。

当然了，模型能力仍在飞速进步。今天的 Claude Opus 4.6、GPT-5.4、Gemini 3.1(?) 比半年前强了不止一个量级。

但即使模型变强了，它使用 CLI 的方式没有变。 

它依然是跑 --help、解析输出、拼命令、看退出码。模型能力的提升让它在每一步的判断更准，但如果 CLI 本身设计得不好，再强的模型也会掉进同样的坑里。

Surge AI 最近做了个案例分析，让一个前沿模型处理一个只需要改 2 行代码的问题。结果它走了 39 轮对话，改了 693 行代码，最终还是失败了。原因是它在第一步就幻觉出了一个不存在的类名，然后在错误的基础上越陷越深，连续 22 轮坚持「核心逻辑是对的」。

而这个幻觉，到底是模型的问题，还是原来代码写的太不 LLM 友好呢？

而另一个，当模型在遇到同样问题时，发现文件内容被截断后，主动要求重新读取，确认了完整内容才动手。然后一次就解决了。

好的 Agent 会区分「观察到的事实」和「猜测」，然后验证假设再行动。差的 Agent 会把猜测当事实，然后一路错下去。

而好的 CLI 设计，也需要能帮 Agent 做这个区分：按 Agent 的习惯进行设计，减少它需要猜的东西，增加它能验证的东西。

02
Agent 怕什么
具体来说，Agent 在使用 CLI 时有几个天然弱点：

大小写敏感的短参数。 这应该算是最容易踩的坑了。

grep 是个典型的例子，但其实远不止 grep 了：

命令
参数
含义
grep -a	
小写
把二进制文件当文本处理
grep -A 5	
大写
显示匹配行后 5 行上下文
grep -i	
小写
忽略大小写
grep -I	
大写
忽略二进制文件
ssh -v	
小写
verbose 模式
ssh -V	
大写
显示版本号
tar -c	
小写
创建归档
tar -C	
大写
切换目录
Token 效率 vs 准确率
Token 效率 vs 准确率
一个字母的大小写，含义完全不同。Agent 是基于概率选择的，当两个 token 的概率接近时，选错的风险就上来了。

交互式提示。 Agent 没法回答 Are you sure? [y/N] 这种问题。2019 年 AWS CLI v2 把默认 pager 改成了 less，直接导致全球数千个 CI 任务挂起。对 Agent 来说，任何交互式环节都是一堵墙。

幻觉参数。 Agent 会自信地使用不存在的参数。前沿模型在这方面已经好了很多，但开源模型和小模型的幻觉率依然不低。更关键的是，你的 CLI 不能假设只有最强的模型才会来调用它。你的用户可能在用 Claude Opus 4.6，也可能在用一个 3B 的本地小模型。

非结构化输出。 给 Agent 一段 JSON，它能立刻提取字段、做条件判断、管道传递。给它一段人类可读的 table 输出……那就得靠猜了。

基于上面这些弱点，我整理了下面的十条原则，每一条都是直接针对 Agent 认知特点的设计对策。

03
原则一：名词在前
命令结构用 noun-verb（名词-动词），别用 verb-noun。

●●●

# 好：noun-verb
docker container ls
gh pr create
lark-cli calendar +agenda
dws contactuser search

# 不好：verb-noun
create-pr
delete-image
search-user
└

为什么呢？因为 Agent 发现命令的过程本质上是一个树搜索。

Agent 的 noun-verb 树搜索
Agent 的 noun-verb 树搜索
先跑 mytool --help，看到有 user、project、billing 三个名词。然后跑 mytool user --help，看到 create、delete、list、search。

这是一个确定性的、逐层缩小范围的过程。Agent 不需要猜，每一步都有 --help 可以查。

而 verb-noun 结构（create-user、create-project、create-billing）把所有操作平铺在一层，Agent 面对的就是一个巨大的扁平列表，没有层级引导。

Docker 的设计就是典范。container、image、volume、network 是名词，ls、rm、create、inspect 是动词。同一个动词在不同名词下语义一致。Agent 只要学会了 docker container ls，就能推断出 docker volume ls。

Linus 说过：「好的代码不是简洁，是重新概念化问题本身，让特殊情况消失在一般情况中。」

noun-verb 结构做的正是这件事：让每个新命令都是已有模式的自然延伸，不再有特殊情况。

04
原则二：长参数优先
所有参数都应该有长格式（--verbose），短格式（-v）作为可选的人类便利。

这条规则对人类来说是建议，对 Agent 来说应该算是硬性要求了。

语义自描述。--dry-run 这个词本身就在告诉 Agent 它的功能：预演、试运行。而 -n（在部分工具中等同于 --dry-run）完全不具备自描述能力。-n 在不同工具中可能意味着 --line-number、--numeric、--no-action，甚至 --name。

消除歧义。-v 在几乎所有工具里都是 verbose，但 -V 在大部分工具里是 version。一个字母的大小写差异改变了全部含义。--verbose 和 --version 之间不存在这种混淆风险。

LLM 的概率优势。 LLM 在训练数据中见过无数次 --output，它和「指定输出位置」的语义绑定经过了海量样本的强化。而 -o 的语义绑定要弱得多，同一个 -o 在不同工具中可能指代完全不同的东西。

钉钉 CLI 有一个设计值得注意：它的 --yes 参数描述是「跳过确认提示（AI Agent 模式）」。参数名本身就是自描述的，Agent 一看就知道该在什么时候加它。

多花几个 token 用长参数，换来的是大幅降低的出错概率。对 Agent 来说，一次错误执行带来的修复成本，远超多花几个 token 的开销。

05
原则三：输出是契约
CLI 的结构化输出不是功能，是 API 契约。

●●●

# stdout 输出 JSON 数据
mytool user list --format json

# stderr 输出人类可读的状态信息
# 二者严格分流
└

stdout 和 stderr 必须严格分离。 JSON 数据走 stdout，进度条、警告、日志全走 stderr。这样 Agent 可以安全地用管道处理，不用担心非 JSON 内容污染数据流。

GitHub CLI 在这方面做得应该是最好的：检测到输出被管道传输时，自动切换为 tab 分隔格式，去掉颜色转义符，文本不截断。飞书 CLI 支持 JSON、NDJSON、table、CSV、pretty 五种格式，覆盖面也挺全。

但有个容易忽略的点：结构化输出一旦发布，就是 API。 Kubernetes v1.14 弃用 --export，v1.18 正式移除，结果数千个 Helm chart 和 CI/CD 管道崩了。因为下游已经依赖了这个输出格式。

加一个新的可选字段，安全。改变已有字段的类型或名称，就是破坏性变更。 要像对待 REST API 版本一样对待 CLI 输出的 schema。

06
原则四：感知环境
CLI 应该检测自己跑在终端（TTY）还是管道（pipe）中，并自动调整行为。

●●●

# 终端中：彩色输出、表格、进度条
mytool status

# 管道中：纯文本、JSON、无颜色、无交互
mytool status | jq'.'
└

Agent 几乎永远是在非 TTY 环境中调用 CLI 的。如果你的 CLI 在非 TTY 时还弹确认框、显示 spinner、输出 ANSI 颜色码，Agent 就会卡住或解析出错。

GitHub CLI 的做法值得我们参考：非 TTY 时自动用 tab 分隔、去颜色、不截断。钉钉 CLI 的 --yes 参数专门为此设计：跳过所有确认提示，进入 AI Agent 模式。

gcloud 的文档里有一条值得所有 CLI 开发者记住的建议：「不要依赖 gcloud 的原始输出格式，永远使用 --format 标志。」 因为原始输出格式可能随版本变化。

更进一步的做法是：CLI 在非 TTY 环境下默认输出 JSON，不该要求 Agent 额外加 --json flag。飞书 CLI 的格式解析逻辑就是这个思路：先看 --json flag，再看 TTY 状态，非 TTY 下自动降级为 JSON。

07
原则五：干跑优先
每个会产生副作用的命令，都应该支持 --dry-run。

从 Agent 的角度看，--dry-run 提供了一个零成本的试错机制。

Agent 不确定一条命令会产生什么后果？先 --dry-run 看看……看到预览结果后，再决定是否真正执行。这本质上是给了 Agent 一个探索-验证的反馈循环，不用一上来就赌博。Agent 使用 CLI 的完整流程

Agent 使用 CLI 的完整流程


钉钉和飞书 CLI 都支持 --dry-run。飞书的实现更细致一些：干跑时会输出完整的请求 URL、方法、参数，Agent 可以在执行前确认请求的正确性。

Lightning Labs 的设计更进一步：--dry-run 使用专门的退出码（exit code 10），这样 Agent 可以通过退出码区分「干跑成功」和「真正执行成功」。

好的 --dry-run 输出应该是结构化的 JSON diff，告诉 Agent 什么会被创建、修改或删除。 光说一句「这是干跑模式」可不够。

08
原则六：退出码控制
退出码对人类来说是可以忽略的细节。对 Agent 来说，退出码是控制流本身。

Agent 执行完一条命令后，它看到的第一个信号其实不是输出内容，是退出码。退出码决定了 Agent 的下一步：成功了继续管道，失败了进入错误处理。

只用 0 和 1 远远不够。Agent 需要更细的粒度来区分不同类型的失败：

退出码
含义
Agent 应对
0
成功
继续执行
1
一般错误
读 stderr 诊断
2
参数错误
修正参数重试
3
资源不存在
跳过或创建
4
权限不足
提示用户授权
5
冲突/已存在
跳过或更新
关键要求：退出码必须跨版本保持稳定。 退出码一旦发布就是契约的一部分，改变退出码的含义和改变 API 返回值一样危险。

09
原则七：防住幻觉
前沿模型的幻觉率已经降了很多，但这不意味着你的 CLI 可以不设防。

原因很简单：输入验证是基本的安全实践，不管调用方是人还是 Agent。 你不会因为「大部分用户都是好人」就取消 SQL 注入防护，同样也不该因为「新模型不太幻觉了」就放松输入校验。

输入验证要严格。 Lightning Labs 的做法值得学习：验证 URL（拒绝 javascript:、file: 协议和嵌入凭据的 URL）、验证域名（拒绝路径分隔符和 shell 元字符）、验证输出路径（拒绝向 .ssh/、.gnupg/ 等敏感目录写入）。

使用枚举约束。 能用枚举的参数不要用自由文本。--format json|table|csv 比 --format <string> 安全得多。Agent 在受限的选项空间里犯错的概率会大幅降低。Anthropic 的 tool use 文档里也推荐了同样的策略。

提供 schema 自省。 让 Agent 可以查询 CLI 自身的能力：

●●●

mytool schema --all# 输出完整命令树的 JSON
mytool schema user create# 输出某个命令的参数定义
└

飞书 CLI 已经实现了这个功能：lark-cli schema calendar.events.list --format pretty 可以输出任何 API 方法的参数、类型和所需权限。这对 Agent 来说相当于一本随时可查的字典，比在训练数据里碰运气靠谱得多了。

这里还有个反直觉的点值得一提：schema 自省应该是按需查询的。

Agent 对常用命令已经有很强的统计记忆，一股脑塞文档反而会干扰它的判断。这也是 CLI 相对于 MCP 的核心优势所在：MCP 把所有工具 schema 全塞进上下文（GitHub MCP 服务器一次注入 55,000 tokens），而 CLI 让 Agent 按需跑 --help，只读当前需要的那一条命令的说明。

10
原则八：幂等设计
能用声明式的就别用命令式的。

●●●

# 命令式：资源已存在会报错
mytool user create --name "john"

# 声明式：无论调用多少次，结果一致
mytool user ensure --name "john"
# 或
mytool user create --name "john" --if-not-exists
└

Agent 会重试。网络超时了重试，上一次执行结果不确定了重试，任务被中断后恢复了……还是重试。如果命令不是幂等的，重试就可能创建两个重复用户、发送两封重复邮件。

kubectl 的 apply 是声明式设计的教科书案例：定义期望状态，Kubernetes 自动协调实际状态。不管 Agent 跑多少次 kubectl apply -f deployment.yaml，结果都一样。

飞书 CLI 的 +messages-send 支持 --idempotency-key 参数，也是这个思路：Agent 传入一个唯一标识符，即使命令被重复执行，服务端也只会处理一次。这个设计应该更广泛地应用到其他命令上。

11
原则九：错误即指南
Agent 犯了错之后，错误信息是它唯一的修复依据。

●●●

{
"error": "permission_denied",
"message": "缺少 calendar:read 权限",
"suggestion": "运行 lark-cli auth login --domain calendar 授权",
"retryable": false
}
└

好的错误信息应该包含四个要素：错误类型（机器可读，Agent 据此决定重试还是放弃）、描述（具体发生了什么）、修复建议（告诉 Agent 怎么解决）、是否可重试（网络超时值得重试，权限不足不值得）。

飞书 CLI 在权限不足时会自动告诉你缺什么权限、怎么补，这个设计对 Agent 特别友好。

还记得前面提到的那个 693 行幻觉案例吗？那个模型连续 22 轮坚持自己的方案是对的，没有根据错误反馈调整方向。好的错误信息应该强到让 Agent 不得不重新审视自己的判断。

12
原则十：帮助即大脑
最后一条，也是最重要的一条。

Anthropic 的 tool use 文档里反复强调一个发现：「描述是影响工具使用准确率的最关键因素。」 他们仅仅通过优化工具描述，就在 SWE-bench 上大幅降低了错误率、提高了完成率。

映射到 CLI，--help 的质量直接决定了 Agent 的表现。

好的 --help 应该：

以示例开头。 clig.dev 的建议：用户（包括 Agent）看到帮助文本时，第一眼找的是示例。把最常用的 2-3 个示例放在最前面。

明确标注必需和可选。--chat-id <required> vs --format <optional, default: json>。Agent 需要知道哪些参数必须传。

参数描述包含值域。 不要只写 --format string，要写 --format json|table|csv。

保持简短。 过长的帮助文本反而会降低 Agent 的准确率。Agent 对常用命令已经有统计记忆，过多信息会干扰判断。50 行以内为佳。

13
给飞书和钉钉打个分
现在，我们拿这十条原则对照一下钉钉和飞书 CLI，指指点点一下。

飞书做得好的： noun-verb 结构清晰，三层架构让 Agent 按需选择抽象层级，schema 命令提供完整 API 自省，五种输出格式，按域申请权限（最小权限原则），权限不足时自动提示修复方案。

飞书可以改进的： 非 TTY 下没有自动切 JSON，退出码没有文档化的细粒度语义，--idempotency-key 应该更广泛使用。

钉钉做得好的：--yes（AI Agent 模式）语义自描述，--mock 参数方便调试，帮助文本全中文（对中文 LLM 更友好），批量熔断防 Agent 失控。

钉钉可以改进的： 命令只有两层缺少 shortcut 快捷层，没有 schema 自省命令，输出格式只有三种，帮助文本缺少使用示例。

14
清单
最后，我再给出一份可以直接拿去用的 checklist，供你（用 Claude Code / Codex 开发你的 CLI 时）参考：

•  [ ] 命令结构是 noun-verb 层级，支持树搜索 

•  [ ] 所有参数都有长格式，短格式可选 

•  [ ] --json 输出结构化数据到 stdout，状态信息走 stderr 

•  [ ] 检测 TTY 状态，非 TTY 环境自动调整输出 

•  [ ] 所有副作用操作支持 --dry-run，输出结构化 diff 

•  [ ] 退出码有文档化的细粒度语义 

•  [ ] 参数用枚举约束值域，输入有严格验证 

•  [ ] 支持 schema 自省命令 

•  [ ] 关键操作设计为幂等，或提供 --if-not-exists

•  [ ] 错误信息包含类型、描述、修复建议和可重试标志 

•  [ ] --help 以示例开头，标注必需/可选，50 行内 

•  [ ] --yes / --no-interactive 跳过所有交互式提示 

这些原则来自 POSIX 标准、GNU 编码规范、clig.dev 社区指南、12 Factor CLI 框架、Anthropic 的 tool use 文档，以及钉钉和飞书 CLI 的实战检验。

15
开源
最后我把本文中的设计规范和开发清单整理成了一个开源项目，你可以直接丢给 Coding Agent 来开发你的 CLI：

“ Reference https://github.com/Johnixr/agent-cli-guide for CLI design principles.

里面有对应的设计规范（GUIDE.md）和开发清单（CHECKLIST.md），Agent 可以直接参考。

欢迎 PR。

◇ ◆ ◇

Linus 曾说：

“ 好的代码不是简洁，是重新概念化问题本身，让特殊情况消失在一般情况中。

好的 Agent CLI，也是同样的道理。

CLI 本身的设计，需要让 Agent 和人类可以用同一套接口，甚至是优于人类。

◇ ◆ ◇

相关链接：

•  POSIX Utility Conventions：https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html 

•  Command Line Interface Guidelines：https://clig.dev/ 

•  12 Factor CLI Apps：https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46 

•  Anthropic Tool Use Best Practices：https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools 

•  Berkeley Function Calling Leaderboard：https://gorilla.cs.berkeley.edu/leaderboard.html 

•  Lightning Labs 10 Agent-CLI Design Axes：https://github.com/lightninglabs/lnget/pull/14 

•  Surge AI Agent Hallucination Analysis：https://surgehq.ai/blog/when-coding-agents-spiral-into-693-lines-of-hallucinations
