2026 年，是造 CLI 的最好时机
CLI 已经 50 岁了，但你现在造一个，可能比任何时候都更应该。

图片
有几件事正在同时发生：Go 和 Rust 让分发变成了一行 curl，Agent 让 CLI 从开发者工具升级成了软件的通用入口，钉钉飞书等大厂也亲自下场做 CLI 了。

如果你读过我这个系列的前几篇文章，应该已经知道 CLI 为什么重要，也大体知道 Agent 友好的 CLI 该怎么设计了：

Karpathy：一切软件，都将为 Agent 重写

GUI 将死，CLI 才是一切

OpenCLI：万物皆可 CLI

钉钉飞书集体抛弃 MCP，CLI 才是 Agent 的终局

给 Agent 设计 CLI 的十个原则

那今天聊的就是下一步：用什么造，怎么造。

01
二十年空白
而在开始之前，先说一个可能让你意外的事实。

从 1995 年到 2015 年，将近二十年，几乎没有什么像样的新 CLI 工具被造出来。

ls、grep、awk、sed、curl，这些我们今天还在用的工具，基本都诞生于 1970 到 1995 年之间。那是 Unix 的黄金年代，每一个命令都算得上是一件精密的手工艺品。

然后呢？

GUI 来了、Web 来了、iPhone 来了……

整个软件行业的注意力，全部涌向了图形界面和移动端。

开 CLI？那是上个时代的事了吧。

Gabe Venberg 在一篇被 Hacker News 广泛讨论的文章里写过：

“ 在 1995 到 2015 的二十年里，CLI 工具的创新几乎完全停滞了。不是因为没有需求，是因为没有人觉得这件事值得做。

直到 Go 和 Rust 出现，局面才被打破。

CLI 工具的三波浪潮
CLI 工具的三波浪潮
为什么是这两门语言呢？答案是：单二进制分发。

以前你用 Python 写个 CLI，用户得先装 Python，再 pip install，还得处理版本冲突、虚拟环境……光是安装流程就能劝退一半人了。

CLI 分发体验对比
CLI 分发体验对比
Go 和 Rust 编译出来的，就是一个独立的二进制文件。一行 curl，下载，给执行权限，完事。不需要运行时，不需要依赖管理，不需要 Docker。

kubectl、docker、gh、hugo、terraform、ripgrep、bat、fd，你现在天天在用的这些工具，全是 Go 或 Rust 写的。

02
终端文艺复兴
2015 年之后发生的事情，现在被社区称为「终端文艺复兴」（Terminal Renaissance）。

最有代表性的，就是 Rust 社区把经典 Unix 命令重写了一遍：

经典命令
现代替代
语言
改进了什么
grep
ripgrep
Rust
快 10 倍，默认递归，自动跳过 .gitignore
cat
bat
Rust
语法高亮，行号，Git diff 标记
ls
eza
Rust
彩色输出，树形视图，Git 状态
find
fd
Rust
语法更直觉，默认忽略隐藏文件
cd
zoxide
Rust
记住你常去的目录，模糊匹配
du
dust
Rust
可视化磁盘占用，彩色层级
sed
sd
Rust
正则语法更直觉，不用转义
经典 vs 现代 CLI 工具对照
经典 vs 现代 CLI 工具对照
这些工具可不只是「更快」而已。

它们在体验层做了一次升级：默认彩色输出、.gitignore 感知、更友好的错误提示、更符合直觉的参数设计。

KDAB 在一篇文章里推荐了一个挺巧妙的渐进式迁移方案：在 .zshrc 里用 alias 把旧命令指向新工具（比如 alias ls="eza"），日常使用时你感觉还是在用老命令，实际跑的已经是新引擎了。脚本里的老命令也不会受影响。

而终端本身，也在进化。

Warp 把终端做成了 IDE 风格的交互体验，Ghostty 用 GPU 加速渲染，Kitty 支持图片内联显示。

CLI 不再是「难用但高效」的代名词了。

它，变好用了。

而这还只是第一波浪潮，给人类用的。

接下来的第二波则更为汹涌，因为它，是 Agent 带来的。

03
Agent 来了
2024 年底到 2025 年初，CLI 的角色发生了一次质变。

Courier 的一篇技术博客里说道：

“ LLM 的训练数据里有几百万条 man page、Stack Overflow 回答和 shell 脚本。你的 CLI 不需要教它怎么用，给它看一下 --help 就够了。

CLI 是 LLM 的母语。MCP 倒更像是后天学的外语。

这也不只是我一个人的感受。

ScaleKit 做了一组严格的 benchmark，拿 GitHub 官方 MCP 服务器和 gh CLI 做对照，跑了 75 轮实验。结果是 CLI 在 token 消耗上便宜 10 到 32 倍，可靠性 100%（MCP 只有 72%）。

CLI 的角色升级
CLI 的角色升级
Composio 的联合创始人跑到旧金山街头做了个现场投票：CLI 还是 MCP？

结果 17 比 3，CLI 压倒性胜出。

然后，钉钉和飞书在同一周官方发布了自家的 CLI 工具。两家都没选 MCP。

CLI 从「开发者的效率工具」，变成了「软件的通用入口」。

Smithery 在一篇《MCP vs CLI Is the Wrong Fight》中给了一个更细致的判断框架：CLI 赢在 LLM 已有训练先验的本地工具（git、docker、ffmpeg 这些），MCP 赢在零训练数据的远程内部 API。

CircleCI 的技术博客也给了类似的结论：内循环用 CLI（速度和 token 效率），外循环用 MCP（团队规模和结构化鉴权）。

但不管怎么分，有一件事正变得越来越明确：

如果你想让 Agent 能操控你的产品，造一个 CLI 应该是性价比最高的选择。

那问题来了……用什么框架造呢？

04
五大框架
每个语言生态都有自己的 CLI 框架王者。

我把五个最主流的拉了出来，来横向看一下：

五大 CLI 框架速览
五大 CLI 框架速览
Go：Cobra

43,500 颗星，173,000 个项目在用。kubectl、docker、gh、hugo、terraform，基本上 Go 生态里有子命令的 CLI 都是它。

Cobra 的核心卖点是子命令树。

你定义好 Command、Flags、Args 三件套，框架帮你自动生成 --help、shell 补全、参数校验。父命令的 PersistentFlags 会自动继承给所有子命令，不用重复定义。

适合场景：中大型 CLI，10 个子命令以上的那种。

飞书 CLI 就用的它。

Python：Typer

18,300 颗星。FastAPI 的作者 Sebastián Ramírez 造的，底层包了 Click。

Typer 的设计哲学跟 FastAPI 一脉相承：用 Python 的类型标注来定义参数，框架自动推断类型、生成帮助文本、做参数校验。写起来确实快，几行代码就能出一个功能完整的 CLI。

●●●

import typer

def main(name: str, age: int = 20, formal: bool = False):
    greeting = f"Good day {name}" if formal else f"Hey {name}"
    typer.echo(f"{greeting}, age: {age}")

typer.run(main)
└

适合场景：快速原型、数据处理脚本、Python 团队的内部工具。

劣势也挺直接的：需要 Python 运行时，分发始终是个大问题。

Rust：Clap

10,000+ 颗星，240,000 个项目在用。ripgrep、bat、fd、dust，前面提到的那波「终端文艺复兴」明星工具，背后的引擎基本都是 Clap。

Clap 提供两种风格：derive macro（用 struct 定义参数，编译期检查）和 builder（运行时动态构建）。derive 风格写起来相当舒服：

●●●

#[derive(Parser)]
struct Cli {
#[arg(short, long)]
    name: String,
#[arg(short, long, default_value_t = 1)]
    count: u8,
}
└

适合场景：高性能工具、追求极致启动速度和安全性的项目。

Node.js：Commander.js

28,000 颗星，每周 5 亿次下载。零依赖，启动只要 18 毫秒。

Commander.js 的定位就是简单可靠。也没什么花哨的功能，但 API 设计干净，文档清晰，社区庞大。如果你的团队是 Node.js 栈，Commander.js 基本就是默认选择了。

oclif（Salesforce 出品，9,400 颗星）则更重一些，TypeScript 优先，自带插件系统和 CLI 脚手架生成器，启动时间 85 毫秒。适合需要插件架构的企业级工具。

Java：Picocli

5,200 颗星。Java 生态里造 CLI 的现代选择。

Picocli 最大的卖点是支持 GraalVM native image 编译，可以把 Java CLI 编译成原生二进制，启动速度从秒级降到毫秒级。还支持 ANSI 彩色输出和 shell 补全。

适合场景：已有 Java 生态的企业团队，不想换语言但想要现代 CLI 体验的。

把这五个框架放到一张定位图上看，位置关系会更直观一些：

框架定位地图
框架定位地图
05
该选哪个
框架介绍完了，实际选型时，该怎么做呢？

Sam Newby 写过一篇文章叫《Why Building CLIs in Go is Better Than Rust》，核心观点其实挺实在的：Go + Cobra + GoReleaser 这套组合，在「快速造出来、跨平台分发」这件事上，目前应该是最省心的。

Railway 团队则提供了一个值得参考的案例。他们把自家 CLI 从 Go 重写成了 Rust，获得了更好的类型安全和 UX 特性（模糊选择、JSON 输出），但代价是显著的团队投入和更长的编译时间。

框架选型决策树
框架选型决策树
而我自己的选型逻辑，则大概是这样：

需要跨平台单二进制分发？

Go 或 Rust。Go 编译快、上手简单；Rust 性能更好、类型更安全，但学习曲线陡。

团队是 Python 栈？

Typer。写起来最快，分发可以用 PyInstaller 打包，但体验跟原生二进制比还是差点意思。

已有 Node.js 工具链？

Commander.js。不要为了造 CLI 换语言，生态一致性比语言性能重要得多。

子命令超过 10 个？

Cobra 或 Clap。它们的子命令树管理能力，是 Typer 和 Commander.js 比不了的。

追求极致性能和长期打磨？

Rust + Clap。代价是前期投入大，但长期维护体验确实最好。

对大多数场景来说，Go + Cobra 依然是最稳的选择。不是因为它最强，是因为它从「造出来」到「分发出去」这条路径最短。

06
Cobra 怎么用
既然推荐了 Cobra，那就展开讲讲它好在哪，因为我最近也在用 go 做一些项目。

Cobra 的核心概念其实就三个：Command、Flags、Args。

Command 是用户能调用的动作：

●●●

cmd := &cobra.Command{
    Use:   "search",
    Short: "Search resources",
    Example: `  my-cli search users --platform github`,
    RunE: func(cmd*cobra.Command, args []string) error {
        // 实际逻辑
    },
}
└

Flags 是 --key value 形式的参数：

●●●

// 本命令独有
cmd.Flags().StringVar(&platform, "platform", "", "Target platform (required)")
cmd.MarkFlagRequired("platform")

// 所有子命令都能继承
rootCmd.PersistentFlags().StringVar(&format, "format", "json", "Output format")
└

这里的 PersistentFlags 是 Cobra 一个挺巧妙的设计。

定义在父命令上的 persistent flag 会自动传递给所有子孙命令。比如 --format 定义在根命令上，那不管是 my-cli search users --format table 还是 my-cli task get --format csv，都能直接用，不用每个命令重复定义一遍。

Args 是不带 -- 的位置参数：

●●●

cmd := &cobra.Command{
    Use:  "get <task_id>",
    Args: cobra.ExactArgs(1),
    RunE: func(cmd*cobra.Command, args []string) error {
        taskID:=args[0]
        // ...
    },
}
└

然后用 AddCommand 把命令树组装起来：

●●●

rootCmd.AddCommand(newTaskCmd())      // my-cli task ...
rootCmd.AddCommand(newSearchCmd())    // my-cli search ...

searchCmd.AddCommand(newSearchUsersCmd())    // my-cli search users
searchCmd.AddCommand(newSearchTagsCmd())     // my-cli search tags
└

最终形成这样一棵树：

●●●

my-cli
├── task
│   ├── get <id>
│   ├── status <id>
│   └── start <id>
├── search
│   ├── users
│   ├── tags
│   └── web
└── config
    ├── get
    └── set
└

Cobra 命令树结构
Cobra 命令树结构
这棵树对 Agent 来说是特别友好的。

Agent 发现命令的过程，本质上就是一个树搜索。先跑 my-cli --help，看到有 task、search、config 三个名词。然后跑 my-cli search --help，看到 users、tags、web。逐层缩小范围，每一步都有确定性的输出。

而 --help 的内容呢，Cobra 帮你全自动生成了：

●●●

$ my-cli search users --help

Search users by platform and filters

Usage:
  my-cli search users [flags]

Examples:
  my-cli search users --platform github --tag "ai ml"

Flags:
      --platform string   Target platform (required)
      --tag string        Search tag
      --limit int         Max results (default 20)

Global Flags:
      --format string   Output format (default "json")
└

你只需要写好 Use、Short、Example 和 flag 定义，Cobra 就把帮助文本、参数校验、shell 补全这些活儿全包了。

Cobra vs 标准库对比
Cobra vs 标准库对比
当然 Cobra 也有缺点。

简单工具用它有点重（就一个 --input 参数的话真不需要它），容易导致全局变量（flag 绑定到包级变量），脚手架工具 cobra-cli 也基本处于停更状态了。

但对 10 个命令以上的中大型 CLI 来说，Cobra 目前还是 Go 生态里没有争议的首选。

做个对比：

方面
标准 flag 包
Cobra
子命令路由
手写 switch os.Args
自动树遍历
--help
手写维护
自动生成
必填参数
手动 if 检查
MarkFlagRequired()
共享参数
每个函数传参
PersistentFlags()
Shell 补全
不支持
bash/zsh/fish/powershell
07
上手造一个
说了这么多框架和原理，到底实际操作起来是什么样的呢？

我自己最近造了一个内部用的 CLI 工具，用的就是 Go + Cobra。但跟传统的开发流程不太一样：全程用 Claude Code 辅助完成的。

流程大概是这样。

我先整理了三样东西作为 context：

设计规范。 就是我之前写的那套 Agent CLI 设计原则的 checklist：noun-verb 结构、长参数优先、JSON 输出、--dry-run 支持等等。

框架知识。 Cobra 的核心用法、命令树组装方式、flag 系统的最佳实践。

业务需求。 这个 CLI 需要操作哪些资源、支持哪些操作、输入输出格式是什么。

当然，最重要的，是基于我现有的代码库。

然后把这三样东西一起丢给 Claude Code，让它生成命令树骨架。

AI 辅助造 CLI 的工作流
AI 辅助造 CLI 的工作流
出来的第一版骨架基本就一步到位了。

命令结构是 noun-verb 的，flag 都有长格式，--help 的 Example 部分也都写好了。我在这个基础上调了一些参数命名、补了几个边界情况的错误处理，大概两三轮迭代就定型了。

有点让我意外的是 --format 全局参数的实现。我只在设计规范里写了「支持 JSON 和 table 两种输出格式」，Claude Code 就自动用了 Cobra 的 PersistentPreRun 钩子在根命令上解析 --format，所有子命令执行时 format 变量已经可用了。这个实现方式，恰好就是 Cobra 的最佳实践。

还有 --dry-run 的处理。Claude Code 让每个写操作命令都检查 dry-run flag，如果开启就只输出「将要执行的操作」的 JSON 预览，不真正执行。结构化的 diff 输出，Agent 可以直接解析。

传统 vs AI 辅助造 CLI
传统 vs AI 辅助造 CLI
整个过程下来，最大的感受就是：瓶颈不再是「怎么写代码」，而是「怎么把需求描述清楚」。

设计规范写得越清晰，Claude Code 生成的代码质量就越高。框架的最佳实践喂得越准确，出来的代码就越符合行业惯例。

换句话说，2026 年造 CLI 的门槛已经低到什么程度了呢？

你把设计原则想清楚，把需求描述写明白，AI 帮你把代码写了。

当然了，AI 生成的代码，我还是会自己审的。

小到参数校验的边界情况、错误信息的措辞、退出码的语义分配，大到逻辑和流程、架构，这些细节 AI 能给你一个 80 分的起点，剩下 20 分还得靠人来打磨。

但从零到八十分这段路，以前可能要一两周，现在 10 分钟就跑完了。全程只需要 2 小时。

08
Agent 友好清单
CLI 造出来了，怎么确保它对 Agent 足够友好呢？

Lightning Labs 在一个 PR 里系统性地实现了 10 个 agent-CLI 设计轴，算是目前我见过的最完整的实战参考了。InfoQ 也发过一篇《Keep the Terminal Relevant: Patterns for AI Agent Driven CLIs》，从设计模式的角度给了不少好建议。

综合这些资料和我自己的实践，精简成六条最关键的：

Agent 友好六要素
Agent 友好六要素
输出必须结构化。--json 或 --format json 输出数据到 stdout，进度条和日志全走 stderr。Agent 解析 JSON 是零成本的，解析人类可读的 table 输出……那就全靠猜了。

退出码要有语义。 别只用 0 和 1。参数错误用 2（Agent 知道该修正参数重试），资源不存在用 3（Agent 知道该跳过或创建），权限不足用 4（Agent 知道该提示用户授权）。Lightning Labs 甚至给 --dry-run 定义了专门的退出码 10。

支持 --dry-run。 每个有副作用的操作都应该能先预览。输出结构化的 JSON diff，告诉 Agent 什么会被创建、修改或删除。

支持 --no-interactive。 Agent 回答不了 Are you sure? [y/N] 这种问题。2019 年 AWS CLI v2 把默认 pager 改成了 less，直接导致全球数千个 CI 任务挂起。这个教训到今天都还有人在踩。

schema 自省。 让 Agent 能查询 CLI 自身的能力。my-cli schema --all 输出完整命令树的 JSON，my-cli schema search users 输出某个命令的参数定义。飞书 CLI 已经实现了这个功能，Agent 用起来确实省了不少事。

错误信息要能指导修复。 错误输出包含四个要素：错误类型（机器可读）、描述（发生了什么）、修复建议（怎么解决）、是否可重试。Agent 犯了错之后，错误信息是它唯一的修复依据。

Agent 使用 CLI 的完整流程
Agent 使用 CLI 的完整流程
这些原则的详细版本和完整的开发 checklist，我之前整理成了一个开源项目，可以直接丢给 AI 来参考。

09
就现在
回头看 CLI 这五十年，其实就是三波浪潮。

第一波，1970 到 1995，Unix 黄金期。一群天才在贝尔实验室和伯克利造出了 ls、grep、awk、sed、pipe，奠定了命令行的基石。

第二波，2015 到 2024，终端文艺复兴。Go 和 Rust 让分发变简单了，Rust 社区把经典工具重写了一遍，CLI 变好用了。

第三波，就是现在。Agent 让 CLI 从开发者工具升级为软件入口，AI 让造 CLI 的门槛降到了「写清楚需求就行」。

你现在造一个 CLI，有成熟的框架可以选（Cobra、Clap、Typer），有 AI 帮你写代码（Claude Code、Codex），有现成的设计规范可以参考（clig.dev、12 Factor CLI、agent-cli-guide）。

框架在，工具在，规范在，速度在。

当然，需求也要在。

◇ ◆ ◇

相关链接：

•  Cobra：https://github.com/spf13/cobra 

•  Clap：https://github.com/clap-rs/clap 

•  Typer：https://github.com/fastapi/typer 

•  Commander.js：https://github.com/tj/commander.js 

•  Picocli：https://github.com/remkop/picocli 

•  Command Line Interface Guidelines：https://clig.dev/ 

•  12 Factor CLI Apps：https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46 

•  Lightning Labs Agent-CLI Design Axes：https://github.com/lightninglabs/lnget/pull/14 

•  The Modern CLI Renaissance：https://gabevenberg.com/posts/cli-renaissance/ 

•  Railway CLI Rust Rewrite：https://blog.railway.com/p/rust-cli-rewrite 

•  ScaleKit MCP vs CLI Benchmark：https://www.scalekit.com/blog/mcp-vs-cli-use 

•  MCP vs CLI Is the Wrong Fight：https://smithery.ai/blog/mcp-vs-cli-is-the-wrong-fight 

•  Keep the Terminal Relevant (InfoQ)：https://www.infoq.com/articles/ai-agent-cli/
