---
title: "设计模式与游戏完美开发：按问题选模式，而不是按目录抄"
description: "把 State、Bridge、Strategy、Command、Observer 等模式放回游戏功能与变化场景中，讨论何时用、何时不用。"
tags: ["module-notes", "architecture", "patterns", "unity", "algorithm", "team"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 设计模式与游戏完美开发：按问题选模式，而不是按目录抄

<ArticleTags />

设计模式最容易被学成一份类图目录：看到 `if/else` 就想 Strategy，看到单例就想全局访问，最后项目里到处是 Manager、Factory、Proxy，却没有一处变化真正被隔离。

蔡升达的《设计模式与游戏完美开发》采用的不是「按 GoF 分类讲 23 个模式」的顺序，而是把模式放回具体游戏功能：场景切换、角色与武器、攻击计算、兵营训练、成就、存档、加载优化。每个模式都从需求出发，再讨论重构、优缺点与需求变化时的应对。

这篇笔记按这条思路重排：先给方法，再按游戏问题选模式。

## 1. 方法的顺序：问题 → 变化 → 模式

书里的每个模式基本遵循同一套结构：

1. **先用非模式的方式实现需求**，让问题暴露；
2. 找出未来最可能变化的那条轴；
3. 引入模式隔离变化；
4. 总结优缺点与副作用；
5. 讨论需求再变化时怎么扩展。

这个顺序很重要。模式不是起点，而是对「已经出现或可预见的变化」的回应。没有变化轴的模式，只是多了一层间接调用。

一个简单的判断：

- 如果你无法说出「未来哪一部分会变」，先不要抽象；
- 如果能说出变化轴，再选能隔离它的最小模式；
- 抽象后必须能用更小的单元测试验证行为。

## 2. 场景与角色 AI：状态模式

游戏最典型的变化轴是「当前处于什么状态，下一步做什么」。场景切换、角色 AI、UI 流程都适合用 State 把「状态判断」从一大坨 `switch` 里拆出来。

```csharp
public interface ISceneState
{
    void Enter();
    void Tick(float deltaTime);
    void Exit();
}

public sealed class BattleSceneState : ISceneState
{
    public void Enter() { /* 加载战斗 UI、订阅事件 */ }
    public void Tick(float dt) { /* 战斗逻辑 */ }
    public void Exit() { /* 解绑、释放 */ }
}
```

关键不在接口，而在**状态的生命周期**：进入时订阅了什么，退出时就要解绑什么。否则场景切换后回调仍指向旧对象，产生最隐蔽的泄漏。

书里也把状态模式用于角色 AI。AI 状态与场景状态结构相似，但要注意 AI 的切换频率远高于场景，状态对象应尽量无分配或复用。

## 3. 主程序与系统通信：Facade 与 Mediator

游戏主程序容易变成「什么都管」的上帝类：初始化各系统、处理输入、切场景、存档、网络。

- **Facade** 提供子系统的高层入口，让外部只依赖一个稳定接口；
- **Mediator** 让系统之间不直接互相引用，而是通过中介者转发。

两者的区别在「谁被简化」：Facade 简化的是外部对子系统的访问；Mediator 简化的是系统之间的多对多通信。

风险也很明确：中介者会逐渐吸收所有逻辑，变成新的上帝对象。判断标准是：中介者只做转发/协调，还是开始做业务决策？后者应该拆回系统内部。

## 4. 角色、武器与计算：Bridge、Strategy、Template Method

### Bridge：角色与武器是两条继承轴

角色有职业，武器有类型。如果直接继承，会出现「法师 + 法杖」「法师 + 剑」「战士 + 法杖」的组合爆炸。

Bridge 把两条轴拆开：

```csharp
public interface IWeapon
{
    void Attack(Character owner);
}

public abstract class Character
{
    protected readonly IWeapon Weapon;
    protected Character(IWeapon weapon) => Weapon = weapon;
    public void Attack() => Weapon.Attack(this);
}
```

角色持有武器接口，而不是继承具体武器。新增武器不影响角色类，新增角色也不影响武器类。

### Strategy：攻击公式是可替换算法

攻击计算会随版本变化：减法、比例减伤、暴击、元素克制、穿透。Strategy 把公式抽成可替换对象，避免在 `CalculateDamage` 里堆 `if`。

但不要把所有小分支都做成 Strategy。只有「算法整体可替换、且会被独立测试/配置」时才值得。

### Template Method：固定流程 + 可变步骤

攻击或受击流程通常有固定顺序：前摇 → 判定 → 结算 → 反馈 → 后摇。Template Method 把顺序固定在基类，把可变步骤留给子类：

```csharp
public abstract class AttackFlow
{
    public void Execute()
    {
        PlayWindup();
        if (!CheckHit()) return;
        ApplyDamage();
        PlayFeedback();
        PlayRecovery();
    }

    protected abstract void PlayWindup();
    protected abstract bool CheckHit();
    protected abstract void ApplyDamage();
    protected virtual void PlayFeedback() { }
    protected virtual void PlayRecovery() { }
}
```

顺序不可变、步骤可覆写，适合「流程稳定但细节多」的系统。代价是继承耦合；如果步骤组合变化更频繁，组合/策略可能更合适。

## 5. 创建与共享：Factory Method、Builder、Flyweight

- **Factory Method**：角色/敌人类型多，创建逻辑集中，避免在业务代码里 `new` 具体类。
- **Builder**：角色由属性、技能、装备、AI 多段组装，构造过程复杂，用 Builder 把「怎么组装」与「最终对象」分开。
- **Flyweight**：大量对象共享同一份不可变数据（如子弹配置、场景静态数据），把内在状态共享、外在状态留在实例上。

Flyweight 的收益依赖对象数量与共享比例。只有几十个对象时，引入缓存与查找可能反而更慢；先测量内存与实例数，再决定。

## 6. UI、兵营与关卡：Composite、Command、责任链

### Composite：UI 层级统一操作

UI 面板、按钮、文本可以统一当成节点：显示、隐藏、刷新、销毁都走同一接口。这样父节点可以递归操作子树，避免在每个面板里手写遍历。

### Command：把操作变成对象

兵营训练、建造、撤销/重做、回放都适合 Command：

```csharp
public interface ICommand
{
    void Execute();
    void Undo();
}
```

把「请求」封装成对象后，可以排队、记录、序列化、撤销。注意命令对象也可能持有引用；撤销栈要明确生命周期，避免把已销毁对象留在历史里。

### Chain of Responsibility：关卡检查按顺序传递

关卡解锁、进入条件、掉落判定可以串成责任链：每个节点只判断自己关心的条件，不满足就返回，满足则传给下一个。

责任链最大的坑是顺序与短路：顺序不同，结果可能不同；某个节点静默吞掉请求，会让后面的系统完全收不到事件。链路要能打印/可视化。

## 7. 成就、存档与查询：Observer、Memento、Visitor

- **Observer**：成就系统订阅击杀、收集、通关等事件，而不是在每个业务系统里硬编码成就判断。事件总线要控制作用域，避免变成隐式全局依赖。
- **Memento**：存档/回滚只保存必要的状态快照，而不是整个对象图。快照的版本兼容与内存上限要提前设计。
- **Visitor**：角色信息查询/导出等「对一组对象做外部操作」的场景，可以用 Visitor 把操作与数据结构分离。代价是新增元素类型要修改 Visitor 接口。

这三类模式都容易过度设计。成就系统在只有 5 个成就时，一个集中判断函数就够了；Visitor 在只有两种角色类型时，直接 `switch` 更清楚。

## 8. 调整与优化：Decorator、Adapter、Proxy

- **Decorator**：前缀/后缀属性、临时 Buff 可以动态叠加，而不是为每种组合建类。叠加顺序会影响结果，必须定义清楚。
- **Adapter**：宠物系统接入外部/旧接口时做转换，避免污染核心模型。
- **Proxy**：资源加载代理延迟真实加载，先返回占位对象，加载完成后再替换。异步失败、取消与占位状态要纳入接口。

Proxy 与 Decorator 结构相似，但意图不同：Proxy 控制访问，Decorator 增加行为。不要为了「看起来像模式」把加载逻辑塞进装饰器。

## 9. 模式选择的代价

| 模式 | 解决的问题 | 主要代价 |
| - | - | - |
| State | 状态分支与生命周期 | 状态类增多、切换管理 |
| Facade/Mediator | 子系统耦合 | 中介者膨胀为上帝对象 |
| Bridge | 多继承轴组合爆炸 | 抽象层与实现层都要维护 |
| Strategy | 算法可替换 | 小分支被过度抽象 |
| Template Method | 固定流程 | 继承耦合 |
| Observer | 发布/订阅解耦 | 隐式依赖、事件风暴 |
| Command | 操作对象化/撤销 | 生命周期与序列化成本 |
| Flyweight | 大量对象共享 | 共享/外在状态划分错误 |
| Decorator | 动态组合 | 顺序与调试复杂度 |
| Proxy | 延迟/访问控制 | 状态机与失败处理 |

可以用四个问题筛选：

1. 这条变化轴是否真实存在，而不是想象出来的？
2. 模式是否让单元测试更容易，而不是更难？
3. 是否引入了额外的生命周期、顺序或内存成本？
4. 有没有更简单的方案（一个函数、一个配置表、一个状态枚举）？

## 10. Unity 落地检查清单

- 状态进入/退出是否成对解绑事件与资源？
- 单例是否只用于真正的全局服务，且可被测试替换？
- 事件总线是否有作用域与生命周期，避免跨场景残留？
- 工厂/建造者是否真的隔离了创建变化，而不是只多了一层调用？
- Flyweight 的共享数据是否不可变，外在状态是否放在实例上？
- Command 的撤销栈是否清理已销毁对象？
- 责任链顺序是否固定、可观察、可短路？
- Decorator 的叠加顺序是否明确并写进测试？
- 资源代理的加载失败/取消是否有明确状态？
- 是否为每个模式写了最小行为测试，而不是只验证类存在？

设计模式的价值在于「让变化有地方发生」。如果一段代码永远不变，用最简单的写法就是最好的模式；如果变化轴清晰，选一个能隔离它的最小结构，再让测试守住行为。

## 参考与延伸

- 蔡升达：《设计模式与游戏完美开发》，清华大学出版社，2017。本文按其「需求 → 模式 → 重构 → 变化应对」的结构重新整理，代码与检查清单为补充实现。
- 相关文档：[游戏设计模式实践](/Tech/Architecture/Game_Design_Patterns_Practice)、[FSM 设计模式](/Tech/FSM_Design_Patterns)、[Unity 反模式](/Tech/Architecture/Unity_Anti_Patterns)、[ECS 完整指南](/Tech/Architecture/ECS_Complete_Guide)。
