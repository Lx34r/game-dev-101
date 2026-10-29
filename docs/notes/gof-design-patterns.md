---
title: "GoF 设计模式：可复用面向对象设计的四条原则与一张模式地图"
description: "从 GoF 原书的原则、目录与 Lexi 案例出发，讲清 23 个模式如何选、如何组合，以及游戏开发中的使用边界。"
tags: ["module-notes", "architecture", "patterns", "unity", "algorithm", "team"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# GoF 设计模式：可复用面向对象设计的四条原则与一张模式地图

<ArticleTags />

《设计模式：可复用面向对象软件的基础》常被当成 23 个模式的类图合集。但原书真正想解决的，是**如何在需求变化时复用设计**：把变化点隔离出来，让对象之间通过稳定接口协作。

这篇笔记不复述每个模式的代码，而是按原书的思路整理四件事：原则、目录、案例与选择边界。已有的一篇[游戏设计模式实践](/notes/design-patterns-game-dev)更偏游戏功能映射，本文更偏 GoF 的“模式语言”。

## 1. 四条底层原则

GoF 在引言里反复强调的设计原则，比具体模式更重要：

### 1.1 面向接口编程，而不是面向实现

调用方依赖抽象接口，具体实现可以替换。这样新增实现不需要修改调用方，测试也能用替身。

### 1.2 优先使用对象组合，而不是类继承

继承把实现绑定在编译期，组合可以在运行期替换。GoF 的很多结构型模式（Bridge、Decorator、Strategy）本质都是“把变化的部分做成对象，再组合进来”。

### 1.3 封装变化点

找出系统中会变化的部分，把它隔离到独立的类/接口中。模式不是目的，**隔离变化**才是。

### 1.4 委托与松耦合

对象把请求转给另一个对象处理，而不是自己承担所有逻辑。委托让职责清晰，也让替换与测试更容易。

这四条原则可以解释为什么同一个模式在不同项目里长得不一样：模式是原则在特定约束下的解法，不是固定模板。

## 2. 23 个模式的目录地图

原书把模式分为三类：

| 类别 | 模式 | 关注点 |
| - | - | - |
| 创建型 | Abstract Factory、Builder、Factory Method、Prototype、Singleton | 对象如何被创建 |
| 结构型 | Adapter、Bridge、Composite、Decorator、Facade、Flyweight、Proxy | 对象如何组合成更大结构 |
| 行为型 | Chain of Responsibility、Command、Interpreter、Iterator、Mediator、Memento、Observer、State、Strategy、Template Method、Visitor | 对象如何交互与分配职责 |

先分类，再选模式。比如“创建逻辑复杂”先看创建型；“对象组合爆炸”先看结构型；“行为/算法变化”先看行为型。

## 3. 一个模式条目应该怎么读

GoF 对每个模式的描述结构本身就是阅读方法：

1. **Intent**：一句话说明它解决什么问题；
2. **Motivation**：一个具体场景；
3. **Applicability**：什么时候适用；
4. **Structure**：类/对象关系；
5. **Participants**：参与者职责；
6. **Collaborations**：它们如何协作；
7. **Consequences**：代价与副作用；
8. **Implementation**：实现注意事项；
9. **Sample Code**：示例；
10. **Known Uses**：真实系统；
11. **Related Patterns**：与哪些模式容易混淆/组合。

大多数人只读 Structure，忽略了 Consequences 与 Related Patterns。真正决定要不要用的是**代价**和**边界**，不是类图。

## 4. Lexi 案例：模式如何协作

原书用一个文档编辑器 Lexi 贯穿案例，展示多个模式如何一起工作：

- **Composite**：文档由字符、行、图等递归组合；
- **Strategy**：不同的格式化/换行算法；
- **Decorator**：给文档元素动态添加边框、滚动等装饰；
- **Bridge**：把“窗口系统/外观”与文档结构解耦；
- **Command**：把用户操作封装成可撤销的命令；
- **Iterator**：遍历文档结构；
- **Visitor**：在不修改元素类的情况下实现拼写检查、断词等操作；
- **Flyweight**：共享字符的图形信息，降低内存。

Lexi 的重点不是“用了多少模式”，而是**每个模式只负责一条变化轴**：结构、格式、外观、操作、遍历、算法。模式之间通过接口协作，而不是互相调用内部实现。

## 5. 游戏开发中的映射

| 游戏问题 | 候选模式 | 说明 |
| - | - | - |
| 敌人生成/主题家族 | Factory Method、Abstract Factory | 按关卡/主题创建一整套对象 |
| 角色/关卡组装 | Builder | 把复杂构造过程与最终对象分离 |
| 子弹/配置共享 | Flyweight、Prototype | 共享不可变数据，或按原型复制变体 |
| 伤害/瞄准/移动算法 | Strategy | 运行期替换规则 |
| AI/角色状态 | State | 把状态转换与行为分离 |
| 输入/技能/回放 | Command | 操作对象化，便于撤销/录制 |
| 成就/UI 事件 | Observer | 发布订阅，降低耦合 |
| 存档/回滚 | Memento | 保存必要状态快照 |
| 第三方 SDK/旧存档 | Adapter | 转换接口，隔离外部依赖 |
| 异步资源加载 | Proxy | 占位对象 + 延迟加载 |
| 伤害修正/输入处理 | Chain of Responsibility | 按顺序处理，可短路 |
| 渲染/平台抽象 | Bridge | 抽象与实现分离 |
| Buff/临时效果 | Decorator | 动态叠加行为 |
| 统计/导出/平衡分析 | Visitor | 外部操作与数据结构分离 |

这些映射只是起点。游戏开发还要考虑帧预算、内存、序列化、热更新与回滚；一个在业务软件里合理的模式，可能在每帧执行的热路径上不合适。

## 6. 容易混淆的模式对

- **Strategy vs State**：Strategy 由外部选择算法；State 由对象内部状态驱动转换。
- **Adapter vs Bridge**：Adapter 让已有接口可用；Bridge 从一开始就把抽象与实现分离。
- **Decorator vs Proxy**：Decorator 增加行为；Proxy 控制访问。
- **Factory Method vs Abstract Factory**：前者创建一个产品；后者创建一组相关产品。
- **Observer vs Mediator**：Observer 是一对多通知；Mediator 把多对多通信集中到中介者。
- **Composite vs Decorator**：Composite 表示整体-部分树；Decorator 包装单个对象增加职责。

选错模式通常不是因为不懂结构，而是没分清**意图**。

## 7. 何时不该用模式

模式会增加间接层。以下情况应优先用更简单的方案：

- 变化轴还不存在，只是“以后可能会变”；
- 只有一两个分支，一个函数/枚举就够；
- 团队不熟悉该模式，维护成本高于收益；
- 热路径上，虚调用/分配/间接层超过预算；
- 现代数据导向设计（ECS）已经用数据与系统替代了部分 OO 模式；
- 模式名会掩盖真正的业务语义，让代码更难读。

GoF 自己也强调模式是“已被验证的起点”，不是必须遵守的规则。

## 8. 应用检查清单

- 当前真正变化的是什么：创建、结构、算法、通信还是状态？
- 调用方是否依赖稳定接口，而不是具体类？
- 能否用组合/参数化替代继承？
- 模式的 Consequences 是否可接受（间接层、对象数量、调试成本）？
- 是否有更简单的实现能通过同样的测试？
- 模式之间的职责是否清晰，是否出现“模式套模式”？
- 团队是否能仅凭模式名理解意图？
- 是否在热路径上，需要重新评估性能？
- 是否为模式写了行为测试，而不是只验证类存在？

GoF 的价值不在于背出 23 个名字，而在于建立一套**讨论设计取舍的共同语言**。当你能说清“这里变化的是算法，不是状态”，模式选择就会自然很多；反过来，先选模式再找问题，通常只会得到更复杂的代码。

## 参考与延伸

- Erich Gamma、Richard Helm、Ralph Johnson、John Vlissides：《设计模式：可复用面向对象软件的基础》（*Design Patterns: Elements of Reusable Object-Oriented Software*）。本文参考其原则、目录与 Lexi 案例框架，未逐字摘录扫描版原文。
- 相关文档：[设计模式与游戏开发](/notes/design-patterns-game-dev)、[游戏设计模式实践](/Tech/Architecture/Game_Design_Patterns_Practice)、[Unity 反模式](/Tech/Architecture/Unity_Anti_Patterns)、[ECS 完整指南](/Tech/Architecture/ECS_Complete_Guide)。
