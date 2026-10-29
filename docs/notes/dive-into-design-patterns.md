---
title: "深入设计模式"
description: "以 22 个经典模式为目录，逐条整理意图、问题、游戏场景、C# 示例、适用边界与模式关系。"
tags: ["module-notes", "architecture", "patterns", "csharp", "unity", "team"]
pageClass: dive-patterns
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 深入设计模式

<ArticleTags />

《深入设计模式》是 Refactoring.Guru 的设计模式读本：它不把模式当成类图模板，而是按“意图—问题—解决方案—结构—适用性—优缺点—关系”逐张展开。这篇笔记沿用这套结构，把 22 个模式放回游戏开发场景，并为每个模式配一段 C# 示例。

::: warning 关于本文
本文是中文阅读整理与游戏开发视角的重写，**不是原书译文，也不能替代原书**。代码示例为本站原创，用来演示职责关系，不追求直接复制进项目即可运行。
:::

::: tip 怎么读
第一遍只看每个模式的**意图**与**问题**，判断自己是否遇到过；第二遍看**方案**与代码，理解角色怎么协作；第三遍看**适用**、**代价**与**关系**，决定要不要引入。22 个模式不需要一次读完，按症状查比按顺序背更有效。
:::

## 1. 模式地图

| 分组 | 数量 | 模式 |
| - | - | - |
| 创建型 | 5 | [工厂方法](#factory-method) · [抽象工厂](#abstract-factory) · [生成器](#builder) · [原型](#prototype) · [单例](#singleton) |
| 结构型 | 7 | [适配器](#adapter) · [桥接](#bridge) · [组合](#composite) · [装饰](#decorator) · [外观](#facade) · [享元](#flyweight) · [代理](#proxy) |
| 行为型 | 10 | [责任链](#chain-of-responsibility) · [命令](#command) · [迭代器](#iterator) · [中介者](#mediator) · [备忘录](#memento) · [观察者](#observer) · [状态](#state) · [策略](#strategy) · [模板方法](#template-method) · [访问者](#visitor) |

参考站的目录收录 22 个经典模式，比 GoF 原书少一个解释器（Interpreter）。数量差异不影响方法：模式是工具箱，不是考试大纲。

## 2. 模式背后的设计原则

在进入具体模式前，先把原书反复强调的几条原则摆出来。它们解释了为什么同一个模式在不同项目里长得不一样。

| 原则 | 一句话 | 在模式里的体现 |
| - | - | - |
| 封装变化 | 找出会变的部分，隔离到独立对象 | 策略封装算法，状态封装阶段，命令封装操作 |
| 面向接口 | 调用方依赖抽象，不依赖具体类 | 工厂返回接口，访问者依赖元素接口 |
| 组合优于继承 | 运行期替换优先于编译期绑定 | 装饰、桥接、策略都用组合替代深层继承 |
| 单一职责 | 一个类只因一个原因变化 | 外观收拢流程，中介者收拢通信 |
| 开闭原则 | 对扩展开放，对修改关闭 | 新增策略/状态/访问者不改上下文 |
| 里氏替换 | 子类必须能替换父类 | 模板方法的钩子不能破坏基类契约 |
| 接口隔离 | 客户端只依赖用得到的方法 | 细粒度的产品接口与访问者方法 |
| 依赖倒置 | 高层与低层都依赖抽象 | 上下文持有接口，不持有具体实现 |

模式不是原则本身，而是原则在特定约束下的落地方式。判断一个模式该不该用时，先问它隔离了哪条变化轴，而不是问它长得像不像书里的图。

## 3. 创建型模式

创建型模式处理“对象怎么来”。它们把 `new` 从业务代码里挪走，让创建时机、创建方式和产品组合可以被替换。

### 工厂方法 Factory Method {#factory-method}

**意图**：在父类中定义创建产品的接口，让子类决定实例化哪一种产品。

**问题**：刷怪器直接 `new Slime()`、`new Bat()`，每加一种敌人就要改刷怪器；如果还有夜间模式、精英模式，类型判断会散落到多个方法里。

**方案**：把“创建哪一种敌人”抽成一个工厂方法。基类负责刷怪流程（取点、初始化、注册），子类只重写创建步骤；客户端只依赖 `IEnemy`。

```csharp
public interface IEnemy { void Place(float x, float y); }

public sealed class Slime : IEnemy
{
    public void Place(float x, float y) { /* 放置史莱姆 */ }
}

public abstract class EnemySpawner
{
    public IEnemy Spawn(float x, float y)
    {
        var enemy = CreateEnemy();   // 子类决定具体类型
        enemy.Place(x, y);
        return enemy;
    }

    protected abstract IEnemy CreateEnemy();
}

public sealed class SlimeSpawner : EnemySpawner
{
    protected override IEnemy CreateEnemy() => new Slime();
}
```

- **适用**：无法预知具体产品类型；框架要留扩展点；希望复用对象池里的实例而不是每次新建。
- **代价**：每个产品配一个创建者子类，类数量上升；产品层次稳定时，这层间接可能不划算。
- **关系**：常作为模板方法中的一个步骤；产品族扩大后可演进为抽象工厂；也可以用原型或生成器替代。

### 抽象工厂 Abstract Factory {#abstract-factory}

**意图**：创建一系列相互匹配的对象，而不指定它们的具体类。

**问题**：游戏要支持暗色与亮色两套 UI，按钮、面板、弹窗必须同风格。如果客户端分别 `new` 这些控件，很容易混搭出一套不协调的界面。

**方案**：声明一个工厂接口，一次生产一整族产品；每个具体工厂保证族内产品相互匹配，客户端只依赖工厂接口。

```csharp
public interface IButton { void Render(); }
public interface IPanel { void Render(); }

public interface IUIFactory
{
    IButton CreateButton();
    IPanel CreatePanel();
}

public sealed class DarkButton : IButton { public void Render() { } }
public sealed class DarkPanel : IPanel { public void Render() { } }

public sealed class DarkUIFactory : IUIFactory
{
    public IButton CreateButton() => new DarkButton();
    public IPanel CreatePanel() => new DarkPanel();
}
```

- **适用**：多套产品族且必须配套；未来可能整套替换风格或平台实现。
- **代价**：新增一种产品（例如弹窗）要改所有工厂接口；类数量明显增加。
- **关系**：通常基于一组工厂方法；可与桥接搭配；如果只是隐藏子系统的创建方式，外观也能做到。

### 生成器 Builder {#builder}

**意图**：把复杂对象的构造拆成多个步骤，用同一套流程产出不同表示。

**问题**：敌人配置有血量、速度、掉落表、技能列表等十几个可选参数。构造函数重载越写越多，调用方很难看出哪些参数是必填的，顺序也容易传错。

**方案**：用链式步骤累积配置，最后 `Build()` 产出结果。需要固定装配顺序时，再加一个主管类（Director）调用这些步骤。

```csharp
public sealed class EnemyConfig
{
    public int Health;
    public float Speed;
    public string LootTable;
}

public sealed class EnemyBuilder
{
    private readonly EnemyConfig _config = new EnemyConfig();

    public EnemyBuilder Health(int value) { _config.Health = value; return this; }
    public EnemyBuilder Speed(float value) { _config.Speed = value; return this; }
    public EnemyBuilder Loot(string id) { _config.LootTable = id; return this; }

    public EnemyConfig Build() => _config;
}

// var boss = new EnemyBuilder().Health(500).Speed(1.2f).Loot("boss").Build();
```

- **适用**：参数多、步骤有顺序、希望隐藏构造细节；需要产出不可变对象。
- **代价**：新增生成器与产品类；简单对象用构造函数即可，不必上生成器。
- **关系**：抽象工厂关注“立即产出一族产品”，生成器关注“分步构造一个复杂产品”；可配合组合模式递归构造树。

### 原型 Prototype {#prototype}

**意图**：复制已有对象，而不让代码依赖它所属的具体类。

**问题**：敌人模板、技能配置的初始化过程很长，重新构造要重复加载资源；有时对象类型在运行期才确定，无法直接 `new`。

**方案**：让对象自己实现 `Clone()`，由它负责复制内部状态。包含列表、字典等可变成员时，要做深拷贝。

```csharp
using System.Collections.Generic;

public interface IEnemyTemplate { IEnemyTemplate Clone(); }

public sealed class EnemyTemplate : IEnemyTemplate
{
    public int Health;
    public float Speed;
    public List<string> Skills = new List<string>();

    public IEnemyTemplate Clone() => new EnemyTemplate
    {
        Health = Health,
        Speed = Speed,
        Skills = new List<string>(Skills)   // 可变集合要深拷贝
    };
}
```

- **适用**：复制比重新构造更便宜；需要预生成一批原型；想避免为每种配置创建子类。
- **代价**：循环引用和外部资源难复制；深拷贝有成本，浅拷贝又会共享状态。
- **关系**：可以看作备忘录的简化版；与组合、装饰配合时，复制复杂结构比从零构造更方便。

### 单例 Singleton {#singleton}

**意图**：保证一个类只有一个实例，并提供一个受控的访问点。

**问题**：音频服务、全局时钟确实只需要一份，但直接写 `static` 又难以替换实现、难以在测试里隔离。

**方案**：私有构造函数 + 静态实例。C# 中可以用 `Lazy<T>` 保证线程安全；更推荐让依赖注入容器管理“单例生命周期”，而不是让类自己承担全局访问。

```csharp
using System;

public sealed class AudioService
{
    private static readonly Lazy<AudioService> _instance =
        new Lazy<AudioService>(() => new AudioService());

    public static AudioService Instance => _instance.Value;

    private AudioService() { }

    public void Play(string cue) { /* 播放音效 */ }
}
```

- **适用**：确实只有一个实例，且需要全局访问；需要严格控制实例数量。
- **代价**：隐藏依赖、测试困难、生命周期与域重载容易出问题；多线程下要额外处理。
- **关系**：外观、抽象工厂、生成器、原型都可以用单例实现；与享元的区别是单例通常可变，享元共享的是不可变状态。

> 创建型记住一句话：**把 `new` 关进工厂，把构造过程变成可替换的步骤。**

## 4. 结构型模式

结构型模式处理“对象怎么组装”。它们不改变对象的行为，而是改变对象之间的连接方式，让接口、职责和层级更灵活。

### 适配器 Adapter {#adapter}

**意图**：让接口不兼容的对象能够合作。

**问题**：项目要接入第三方统计 SDK，它的接口是 `SendEvent(string name, string payload)`，而项目内部统一用 `IAnalytics.Track(string eventName, int value)`，且 SDK 源码不能改。

**方案**：写一个适配器实现项目接口，内部把调用转换成 SDK 需要的形式。客户端只看到项目接口，不知道 SDK 的存在。

```csharp
public interface IAnalytics { void Track(string eventName, int value); }

public sealed class LegacySdk
{
    public void SendEvent(string name, string payload) { }
}

public sealed class LegacyAnalyticsAdapter : IAnalytics
{
    private readonly LegacySdk _sdk;

    public LegacyAnalyticsAdapter(LegacySdk sdk) => _sdk = sdk;

    public void Track(string eventName, int value) =>
        _sdk.SendEvent(eventName, value.ToString());
}
```

- **适用**：遗留系统、第三方库、接口不兼容但语义可以映射。
- **代价**：多一层转换类；如果服务端接口可以直接改，优先改接口而不是加适配器。
- **关系**：装饰不改变接口只增强功能；代理保持同一接口做访问控制；外观为整个子系统提供简化入口。

### 桥接 Bridge {#bridge}

**意图**：把抽象与实现拆成两个可以独立扩展的层次。

**问题**：武器有剑、弓、法杖，元素有火、冰、雷。如果按“武器 × 元素”建子类，会出现火剑、冰剑、雷剑、火弓……类数量按乘法增长。

**方案**：让武器持有元素接口，两个维度各自继承。武器负责攻击流程，元素负责伤害修正，运行期可以替换。

```csharp
public interface IDamageElement { int Modify(int raw); }

public sealed class FireElement : IDamageElement
{
    public int Modify(int raw) => raw + 5;
}

public abstract class Weapon
{
    protected readonly IDamageElement Element;
    protected Weapon(IDamageElement element) => Element = element;
    public abstract int Damage();
}

public sealed class Sword : Weapon
{
    public Sword(IDamageElement element) : base(element) { }
    public override int Damage() => Element.Modify(10);
}
```

- **适用**：两个以上独立变化维度；需要在运行期切换实现；要构建与平台无关的高层逻辑。
- **代价**：对本来就高内聚的小类使用桥接，会让代码更复杂。
- **关系**：与策略结构相似，但桥接是结构拆分，策略是算法替换；可与抽象工厂搭配，由工厂决定具体实现。

### 组合 Composite {#composite}

**意图**：把对象组成树状结构，并以统一方式使用单个对象和组合对象。

**问题**：技能系统里既有单个技能，也有技能组；UI 里既有按钮，也有面板容器。客户端不想每次都判断“这是单个还是一组”。

**方案**：定义统一接口，叶子节点实现具体行为，容器节点持有子节点并递归调用。

```csharp
using System.Collections.Generic;

public interface IAbility { void Cast(); }

public sealed class Fireball : IAbility
{
    public void Cast() { /* 释放火球 */ }
}

public sealed class AbilityGroup : IAbility
{
    private readonly List<IAbility> _children = new List<IAbility>();

    public void Add(IAbility ability) => _children.Add(ability);

    public void Cast()
    {
        foreach (var child in _children) child.Cast();
    }
}
```

- **适用**：树形结构；客户端希望忽略“单个/一组”的差异；需要递归处理整体与部分。
- **代价**：为了统一接口，可能把差异很大的类强行一般化，接口会变得难懂。
- **关系**：可以用迭代器遍历、用访问者批量操作、用享元共享叶节点；与装饰结构相似，但装饰只有一个子组件。

### 装饰 Decorator {#decorator}

**意图**：通过包装对象，在运行期给原对象叠加新行为。

**问题**：武器要支持火焰、吸血、暴击等附魔，且玩家可以任意组合。用继承会得到“火焰吸血暴击剑”这样的类爆炸，而且附魔需要运行时增删。

**方案**：装饰器实现与被装饰对象相同的接口，内部持有它，在调用前后追加行为；多个装饰可以层层嵌套。

```csharp
public interface IWeapon { int Damage(); }

public sealed class Sword : IWeapon
{
    public int Damage() => 10;
}

public abstract class WeaponDecorator : IWeapon
{
    protected readonly IWeapon Inner;
    protected WeaponDecorator(IWeapon inner) => Inner = inner;
    public abstract int Damage();
}

public sealed class FireEnchant : WeaponDecorator
{
    public FireEnchant(IWeapon inner) : base(inner) { }
    public override int Damage() => Inner.Damage() + 5;
}
```

- **适用**：运行时添加/移除职责；继承难以表达组合；多个可选行为需要自由叠加。
- **代价**：装饰顺序会影响结果；从栈中移除某一层比较困难；初始化代码可能很冗长。
- **关系**：代理保持同一接口但控制访问与生命周期；适配器改变接口；组合管理多个子节点。

### 外观 Facade {#facade}

**意图**：为复杂子系统提供一个简化的统一入口。

**问题**：切换场景要依次存档、停止音频、显示加载页、加载资源、恢复 UI。调用方只要漏掉一步，就会出现状态残留或黑屏。

**方案**：用一个外观类封装固定流程，客户端只调用一个方法；底层能力仍然保留，需要时可以直接使用。

```csharp
using System.Threading.Tasks;

public sealed class SceneFacade
{
    private readonly SaveService _save = new SaveService();
    private readonly AudioService _audio = new AudioService();
    private readonly LoadingScreen _screen = new LoadingScreen();

    public async Task LoadAsync(string scene)
    {
        await _screen.ShowAsync();
        _audio.StopAll();
        _save.Flush();
        await SceneLoader.LoadAsync(scene);
        await _screen.HideAsync();
    }
}
```

- **适用**：子系统复杂、常用流程固定；需要为分层结构提供入口。
- **代价**：外观容易演化成上帝对象；它只简化调用，不阻止客户端绕过它直接操作子系统。
- **关系**：中介者集中组件之间的通信，外观只提供简化入口；代理与真实对象同接口，外观通常定义新接口。

### 享元 Flyweight {#flyweight}

**意图**：共享大量对象中相同的状态，把变化部分留在对象外部。

**问题**：弹幕游戏同屏几千颗子弹，每颗都保存贴图、速度、伤害，内存迅速膨胀；这些数据其实按子弹类型完全一致。

**方案**：把状态拆成内禀状态（类型共享）和外赋状态（每颗子弹的位置、速度）。用工厂缓存类型对象，子弹只持有类型引用和自身状态。

```csharp
using System.Collections.Generic;

public sealed class BulletType
{
    public string Sprite;
    public float Speed;
    public int Damage;
}

public sealed class BulletTypeFactory
{
    private readonly Dictionary<string, BulletType> _types =
        new Dictionary<string, BulletType>();

    public BulletType Get(string id) =>
        _types.TryGetValue(id, out var type)
            ? type
            : _types[id] = Load(id);

    private static BulletType Load(string id) =>
        new BulletType { Sprite = id, Speed = 8f, Damage = 1 };
}

public sealed class Bullet
{
    public BulletType Type;
    public float X, Y, Vx, Vy;
}
```

- **适用**：对象数量巨大、内存是瓶颈、状态可以清晰拆成共享与独有两部分。
- **代价**：每次使用都要组合外部状态，可能牺牲速度换内存；代码复杂度上升。
- **关系**：可以共享组合树的叶节点；与单例不同，享元可以有多个实例，且共享状态应保持不可变。

### 代理 Proxy {#proxy}

**意图**：提供原对象的替身，控制对它的访问。

**问题**：高清贴图加载慢，排行榜请求昂贵，某些操作还需要权限校验。客户端不应该直接持有真实对象，也不应该关心这些前置逻辑。

**方案**：代理实现与真实对象相同的接口，内部负责懒加载、鉴权、缓存或远程转发；客户端无感知。

```csharp
public interface IArtAsset { void Draw(); }

public sealed class TextureAsset : IArtAsset
{
    public void Draw() { /* 真正绘制 */ }
}

public sealed class LazyTextureProxy : IArtAsset
{
    private readonly string _path;
    private TextureAsset _real;

    public LazyTextureProxy(string path) => _path = path;

    public void Draw()
    {
        _real ??= Load(_path);
        _real.Draw();
    }

    private static TextureAsset Load(string path) => new TextureAsset();
}
```

- **适用**：延迟初始化、访问控制、远程代理、日志、缓存、智能引用。
- **代价**：新增大量类；请求可能多一层延迟；不要用代理掩盖本来就不合理的接口。
- **关系**：代理通常自己管理服务对象的生命周期，装饰由客户端控制；适配器改接口，外观简化子系统。

> 结构型记住一句话：**先问接口变不变，再问包一层是为了转换、增强、控制，还是简化。**

## 5. 行为模式

行为模式处理“职责怎么流动”。它们把算法、状态、请求和通信从对象中抽出来，让变化点可以被独立替换。

### 责任链 Chain of Responsibility {#chain-of-responsibility}

**意图**：让请求沿处理者链传递，直到被某个处理者处理。

**问题**：伤害结算要依次经过闪避、护甲、护盾、血量，顺序可能因玩法而变。写成一串 `if` 后，新增一个减伤环节就要改整段逻辑。

**方案**：每个处理者持有下一个处理者的引用，自己决定处理、修改后继续传递，或直接放行。链可以在运行时组装。

```csharp
using System;

public abstract class DamageHandler
{
    private DamageHandler _next;

    public DamageHandler SetNext(DamageHandler next)
    {
        _next = next;
        return next;
    }

    public virtual int Handle(int damage) =>
        _next?.Handle(damage) ?? damage;
}

public sealed class ArmorHandler : DamageHandler
{
    public override int Handle(int damage) =>
        base.Handle(Math.Max(0, damage - 3));
}

public sealed class ShieldHandler : DamageHandler
{
    private int _shield = 10;

    public override int Handle(int damage)
    {
        var absorbed = Math.Min(_shield, damage);
        _shield -= absorbed;
        return base.Handle(damage - absorbed);
    }
}
```

- **适用**：多个候选处理者、顺序可配置、发送方不该知道谁处理。
- **代价**：请求可能无人处理；链路长了难调试；每层都有调用开销。
- **关系**：结构与装饰相似，但责任链可以中断传递；命令建立单向连接，中介者清空直接连接，观察者支持动态订阅。

### 命令 Command {#command}

**意图**：把请求封装成独立对象，从而参数化、排队、记录或撤销操作。

**问题**：录像回放、撤销操作需要记录“谁在什么时候做了什么”，直接调用方法无法保存参数，也无法反向执行。

**方案**：命令对象保存接收者与参数，提供 `Execute` 和 `Undo`；历史栈负责记录与回滚。

```csharp
using System.Collections.Generic;
using UnityEngine;

public interface ICommand { void Execute(); void Undo(); }

public sealed class MoveCommand : ICommand
{
    private readonly Transform _target;
    private readonly Vector3 _delta;

    public MoveCommand(Transform target, Vector3 delta)
    {
        _target = target;
        _delta = delta;
    }

    public void Execute() => _target.position += _delta;
    public void Undo() => _target.position -= _delta;
}

public sealed class CommandHistory
{
    private readonly Stack<ICommand> _done = new Stack<ICommand>();

    public void Run(ICommand command)
    {
        command.Execute();
        _done.Push(command);
    }

    public void Undo()
    {
        if (_done.Count > 0) _done.Pop().Undo();
    }
}
```

- **适用**：撤销/重做、操作排队、网络发送、录像回放、宏命令。
- **代价**：发送者与接收者之间多一层对象；复杂状态的回滚通常还要配合备忘录。
- **关系**：命令把操作变成对象，策略把算法变成可替换实现；与备忘录配合实现可靠撤销。

### 迭代器 Iterator {#iterator}

**意图**：在不暴露集合内部结构的前提下遍历元素。

**问题**：背包是二维格子，未来可能改成稀疏字典。如果外部代码直接按行列访问，结构一变，所有遍历代码都要改。

**方案**：集合实现统一的迭代接口，把遍历细节留在集合内部；客户端只关心“下一个元素”。

```csharp
using System.Collections;
using System.Collections.Generic;

public sealed class Inventory : IEnumerable<Item>
{
    private readonly Item[,] _slots = new Item[8, 6];

    public IEnumerator<Item> GetEnumerator()
    {
        for (var y = 0; y < 6; y++)
        for (var x = 0; x < 8; x++)
        {
            var item = _slots[x, y];
            if (item != null) yield return item;
        }
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
```

- **适用**：集合结构复杂或会变化；需要多种遍历方式；希望把遍历代码从业务逻辑中抽离。
- **代价**：简单集合上使用属于过度设计；某些特殊结构的迭代器可能比直接遍历慢。
- **关系**：可遍历组合树；与访问者配合，在遍历时对不同类型的元素执行操作。

### 中介者 Mediator {#mediator}

**意图**：把对象之间混乱的网状依赖收拢到一个中介者对象。

**问题**：单位、UI、音效、成就系统互相引用，改一个单位的死亡逻辑要动好几个系统；组件也因此难以复用。

**方案**：组件只依赖中介者，通过它发送事件；中介者集中决定谁该响应、按什么顺序响应。

```csharp
public interface IBattleMediator { void Notify(Unit sender, string evt); }

public sealed class Unit
{
    private readonly IBattleMediator _mediator;
    public int Hp = 100;

    public Unit(IBattleMediator mediator) => _mediator = mediator;

    public void TakeDamage(int amount)
    {
        Hp -= amount;
        _mediator.Notify(this, "damaged");
    }
}

public sealed class BattleMediator : IBattleMediator
{
    public void Notify(Unit sender, string evt)
    {
        if (evt == "damaged" && sender.Hp <= 0)
        {
            // 结算掉落、播放死亡表现、通知成就系统
        }
    }
}
```

- **适用**：多对多交互；组件需要在不同应用中复用；交互规则需要集中管理。
- **代价**：中介者容易膨胀成上帝对象；所有通信都经过它，可能成为性能与维护瓶颈。
- **关系**：外观只简化入口，不集中组件通信；观察者建立动态订阅；中介者常借助观察者实现。

### 备忘录 Memento {#memento}

**意图**：在不破坏封装的前提下保存对象状态，并在需要时恢复。

**问题**：关卡内撤销、检查点、Boss 战重试都需要快照。如果让外部直接读写玩家私有字段，封装就被破坏了。

**方案**：由原发器自己创建快照，负责人只负责保存和归还，不读取快照内容。

```csharp
using System.Collections.Generic;

public sealed class PlayerMemento
{
    public readonly int Hp;
    public readonly float X, Y;

    public PlayerMemento(int hp, float x, float y)
    {
        Hp = hp;
        X = x;
        Y = y;
    }
}

public sealed class Player
{
    public int Hp = 100;
    public float X, Y;

    public PlayerMemento Save() => new PlayerMemento(Hp, X, Y);

    public void Restore(PlayerMemento memento)
    {
        Hp = memento.Hp;
        X = memento.X;
        Y = memento.Y;
    }
}

public sealed class Caretaker
{
    private readonly Stack<PlayerMemento> _history = new Stack<PlayerMemento>();

    public void Backup(Player player) => _history.Push(player.Save());

    public void Undo(Player player)
    {
        if (_history.Count > 0) player.Restore(_history.Pop());
    }
}
```

- **适用**：撤销、事务回滚、检查点；需要保存包含私有成员的状态。
- **代价**：频繁快照会消耗大量内存；负责人必须管理快照的生命周期。
- **关系**：与命令配合实现撤销；原型可以看作简化版备忘录；迭代器可以保存遍历状态。

### 观察者 Observer {#observer}

**意图**：定义一对多的订阅机制，状态变化时通知所有订阅者。

**问题**：血量变化后要更新血条、成就、音效、伤害数字。发布方不应该逐个依赖这些系统，订阅者也应该能动态加入或退出。

**方案**：发布者维护订阅列表，状态变化时逐个通知；订阅者实现统一接口，运行时订阅或取消。

```csharp
using System.Collections.Generic;

public interface IHealthListener { void OnHealthChanged(int value); }

public sealed class Health
{
    private readonly List<IHealthListener> _listeners =
        new List<IHealthListener>();

    public int Value { get; private set; } = 100;

    public void Subscribe(IHealthListener listener) => _listeners.Add(listener);
    public void Unsubscribe(IHealthListener listener) => _listeners.Remove(listener);

    public void TakeDamage(int amount)
    {
        Value -= amount;
        foreach (var listener in _listeners)
            listener.OnHealthChanged(Value);
    }
}
```

- **适用**：事件驱动、UI 与玩法解耦、订阅关系动态变化。
- **代价**：通知顺序不确定；忘记取消订阅会造成泄漏；事件过多时调用链难追踪。
- **关系**：中介者集中通信，观察者建立动态订阅；责任链按顺序处理，命令建立单向连接。

### 状态 State {#state}

**意图**：对象内部状态变化时改变其行为，看起来像换了类。

**问题**：敌人 AI 用枚举加 `switch`，状态一多，每个方法都要判断当前状态；状态转换规则散落在各处，新增状态容易漏改。

**方案**：把每个状态做成独立类，上下文把行为委托给当前状态；状态自己决定下一个状态，或由上下文统一管理转换。

```csharp
public interface IEnemyState { IEnemyState Tick(Enemy enemy, float dt); }

public sealed class Enemy
{
    public float Distance;
    public IEnemyState State = new IdleState();

    public void Tick(float dt) => State = State.Tick(this, dt);
}

public sealed class IdleState : IEnemyState
{
    public IEnemyState Tick(Enemy enemy, float dt) =>
        enemy.Distance < 8f ? new ChaseState() : this;
}

public sealed class ChaseState : IEnemyState
{
    public IEnemyState Tick(Enemy enemy, float dt) =>
        enemy.Distance < 1.5f ? new AttackState()
        : enemy.Distance > 12f ? new IdleState()
        : this;
}
```

- **适用**：状态多、转换复杂、行为随状态变化；条件分支已经难以维护。
- **代价**：状态很少或几乎不变时属于过度设计；状态类之间可能产生耦合。
- **关系**：可以看作策略的扩展，状态允许自己触发转换；策略通常由客户端选择，算法之间彼此独立。

### 策略 Strategy {#strategy}

**意图**：定义一系列可互换的算法，让它们在运行时替换。

**问题**：防御塔的索敌规则有最近、最低血量、最高威胁、优先飞行单位等多种。写死在塔里会形成越来越长的条件分支，换规则还要改塔的代码。

**方案**：把每种索敌规则抽成策略类，塔持有策略接口，运行时替换；塔只负责“选一个目标并攻击”。

```csharp
using System.Collections.Generic;
using System.Linq;

public interface ITargetSelector { Unit Select(IReadOnlyList<Unit> candidates); }

public sealed class NearestSelector : ITargetSelector
{
    public Unit Select(IReadOnlyList<Unit> candidates) =>
        candidates.OrderBy(c => c.Distance).FirstOrDefault();
}

public sealed class LowestHealthSelector : ITargetSelector
{
    public Unit Select(IReadOnlyList<Unit> candidates) =>
        candidates.OrderBy(c => c.Hp).FirstOrDefault();
}

public sealed class Tower
{
    public ITargetSelector Selector = new NearestSelector();

    public Unit Acquire(IReadOnlyList<Unit> candidates) =>
        Selector.Select(candidates);
}
```

- **适用**：同一任务有多种算法；需要在运行时切换；算法实现依赖复杂、想与业务逻辑隔离。
- **代价**：客户端必须知道策略差异并负责选择；算法很少变化时，引入接口只会增加复杂度。
- **关系**：状态会自行转换，策略由客户端选择；命令封装操作，策略封装算法；C# 中简单的策略可以用委托替代。

### 模板方法 Template Method {#template-method}

**意图**：在父类中固定算法骨架，让子类重写特定步骤。

**问题**：回合制的“开始—结算—结束”流程在多个阶段重复，只有结算逻辑不同。复制整段流程会导致改一处要同步改很多地方。

**方案**：基类定义不可变的流程方法，按顺序调用步骤；子类只实现或覆盖允许变化的步骤。

```csharp
public abstract class TurnPhase
{
    public void Run()          // 骨架：子类不应重写
    {
        Begin();
        Resolve();
        End();
    }

    protected virtual void Begin() { }
    protected abstract void Resolve();
    protected virtual void End() { }
}

public sealed class CombatPhase : TurnPhase
{
    protected override void Resolve()
    {
        // 结算伤害与死亡
    }
}
```

- **适用**：流程稳定、只有部分步骤变化；多个类的算法几乎相同。
- **代价**：继承限制了灵活性；步骤太多时维护困难；子类抑制默认步骤可能违反里氏替换。
- **关系**：工厂方法是模板方法的特例；策略用组合替代继承，可在运行时切换整个算法。

### 访问者 Visitor {#visitor}

**意图**：把作用于对象结构的算法与对象本身分离。

**问题**：道具类型相对稳定（武器、护甲、药水），但运营要不断加“估值导出”“掉落统计”“商店定价”等操作；每加一个操作就改所有道具类，违反开闭原则。

**方案**：元素提供 `Accept(visitor)`，访问者为每种元素实现一个方法；新增操作只需新增访问者，不改元素类。

```csharp
public interface IItemVisitor
{
    void Visit(WeaponItem item);
    void Visit(PotionItem item);
}

public interface IItem { void Accept(IItemVisitor visitor); }

public sealed class WeaponItem : IItem
{
    public int Attack;
    public void Accept(IItemVisitor visitor) => visitor.Visit(this);
}

public sealed class PotionItem : IItem
{
    public int Heal;
    public void Accept(IItemVisitor visitor) => visitor.Visit(this);
}

public sealed class StatExportVisitor : IItemVisitor
{
    public int TotalAttack;

    public void Visit(WeaponItem item) => TotalAttack += item.Attack;
    public void Visit(PotionItem item) { }
}
```

- **适用**：对象结构稳定、操作集合频繁扩展；需要对组合树批量执行操作。
- **代价**：新增元素类型要更新所有访问者；访问者可能接触元素私有状态，破坏封装。
- **关系**：可以看作命令的加强版，能对不同类型元素执行操作；常与组合、迭代器配合。

> 行为模式记住一句话：**先分清是换算法、换状态、存操作，还是换通信方式。**

## 6. 近亲模式怎么分

模式之间最危险的不是“不会写”，而是“结构写对了，意图用错了”。下面几组最容易混。

### 6.1 适配器、装饰、代理、外观、桥接

它们都在原对象外面包一层，区别在于**接口变不变、为什么包**：

| 模式 | 对外接口 | 包裹目的 | 典型场景 |
| - | - | - | - |
| 适配器 | 换成客户端期望的接口 | 让不兼容的接口合作 | 接第三方 SDK、旧存档格式 |
| 装饰 | 保持同一接口 | 运行时叠加职责 | 武器附魔、角色 Buff |
| 代理 | 保持同一接口 | 控制访问、延迟或转发 | 资源懒加载、权限、远程调用 |
| 外观 | 提供新的简化接口 | 收敛子系统的使用方式 | 一帧内完成存档、加载与转场 |
| 桥接 | 抽象与实现各自扩展 | 拆开两个独立变化维度 | 武器 × 元素、渲染 × 平台 |

桥接和适配器最容易混。一个看时间点：桥接通常在开发前期设计，让两部分独立演进；适配器多在既有代码上补救。另一个看目的：桥接是拆维度，适配器是接接口。

### 6.2 策略、状态、命令、模板方法

| 模式 | 谁拥有行为 | 变化方式 | 一句话记忆 |
| - | - | - | - |
| 策略 | 客户端选择算法对象 | 运行时替换 | 换算法 |
| 状态 | 状态自己或上下文决定转换 | 随内部状态改变 | 换阶段 |
| 命令 | 调用方持有命令对象 | 排队、记录、撤销 | 存操作 |
| 模板方法 | 父类固定骨架 | 子类重写步骤 | 定骨架 |

补充两条边界：装饰改变对象的“外表”，策略改变对象的“本质”；模板方法基于继承、编译期确定，策略基于组合、运行期切换。

### 6.3 工厂方法、抽象工厂、生成器、原型

| 模式 | 关注点 | 容易混淆的地方 |
| - | - | - |
| 工厂方法 | 一个产品的创建延迟到子类 | 只创建一个产品，不是产品族 |
| 抽象工厂 | 一族相互匹配的产品 | 产品族有配套约束时才值得 |
| 生成器 | 分步构造复杂对象 | 重点是过程与结果，不是“多一个工厂类” |
| 原型 | 复制已有实例 | 适合状态复杂或运行期才确定类型的场景 |

## 7. 从坏味道反推重构

参考站还有一套重构目录：代码坏味道与重构手法。把两边接起来，才能避免“为了用模式而用模式”。

| 坏味道 | 先做的重构 | 可能导向的模式 |
| - | - | - |
| 到处是 `switch`/`if` 判断类型 | 用多态替换条件表达式 | 状态、策略 |
| 临时字段只在某些操作中有效 | 抽取类，或引入空对象 | 状态、空对象 |
| 一个类因多种原因被修改 | 抽取类、搬移方法 | 外观、中介者、命令 |
| 改一处要动很多文件 | 搬移方法/字段、内联类 | 观察者、中介者 |
| 中间人只做转发 | 移除中间人 | 装饰/代理/外观过度使用的信号 |
| 预留了没人用的扩展点 | 折叠继承、内联类 | 直接删掉，不要用模式补救 |
| 注释在解释一段代码做了什么 | 抽取方法、重命名 | 模板方法、策略 |

最后两行尤其重要。“投机性泛化”和“中间人”都是模式滥用的典型产物：接口、抽象层、转发类都在，但没有一条真实的变化轴。此时正确的动作是删减，而不是再引入一个模式把结构撑住。

## 8. 语言特性与模式

原书对模式有一条很实际的批评：当语言缺少某种抽象能力时，模式会成为补偿方案。C# 与 Unity 的日常开发中，一部分模式已经被语言特性吸收。

| 模式 | 轻量替代 | 仍需模式的场景 |
| - | - | - |
| 策略 | 委托、`Func`、接口 + 少量实现 | 算法需要独立依赖、配置或多方法协作 |
| 命令 | 委托、闭包、队列 | 需要撤销、序列化、重放或审计 |
| 观察者 | `event`、响应式流 | 需要弱引用、优先级、线程调度或事件治理 |
| 迭代器 | `IEnumerable` / `yield return` | 需要多种遍历策略或快照语义 |
| 单例 | 依赖注入容器中的单例生命周期 | 引擎入口、全局服务定位（仍需谨慎） |
| 模板方法 | 抽象基类、局部函数 | 骨架稳定且子类扩展点清晰 |
| 访问者 | 模式匹配、`switch` 表达式 | 对象结构稳定、操作集合频繁扩展 |

语言特性替代的是**结构**，不是**意图**。团队仍然需要“这里用的是策略还是状态”这样的词，来讨论职责归属与转换规则；只是不必每次都写出一整套类图。

## 9. 游戏开发中的高频组合

- **角色行为**：状态负责阶段与转换，策略负责同一阶段内可替换的计算（仇恨选择、伤害公式）。
- **输入与回放**：命令把输入封装成对象，配合队列实现帧同步、撤销或录像回放。
- **UI 与成就**：观察者解耦“发生了什么”和“谁关心”，但要给事件命名与生命周期立规矩。
- **大量单位**：享元共享内禀数据，对象池复用实例；对象池不是 GoF 模式，而是引擎侧的惯用技巧。
- **技能与装备**：装饰叠加效果，组合表达技能树或 UI 层级，访问者适合对稳定的道具结构批量加新操作。
- **反模式预警**：Manager 泛滥、事件总线全连接、为了“以后可能扩展”而预留的抽象，都可以对照 [Unity 反模式](/Tech/Architecture/Unity_Anti_Patterns) 与 [ECS 实践](/Tech/Architecture/ECS_Complete_Guide) 检查。

## 10. 选用检查清单

- [ ] 我能用一句话说出要隔离的变化轴吗？
- [ ] 这个变化已经发生，还是只是“以后可能”？
- [ ] 不加这层间接，最坏后果是什么？
- [ ] 我选的是模式的意图，还是只看中了它的类图？
- [ ] 它和哪个近亲模式最容易混？我用什么判据排除的？
- [ ] 新增的接口、类和转发，是否让调用方更难理解？
- [ ] 语言或框架是否已经提供了更轻的等价能力？
- [ ] 这段代码有没有对应的坏味道？先做小步重构能否解决？
- [ ] 团队能否用模式名准确沟通，而不是各说各话？
- [ ] 如果半年后删除这个模式，成本有多大？

如果前三条答不上来，通常说明现在不需要模式，只需要一次小重构。

## 11. 参考与延伸

- 原书：亚历山大·什韦茨，《深入设计模式》（Refactoring.Guru），2021 版。本文为中文整理与游戏开发视角的补充，不是译文。
- 原文参考：[设计模式首页](https://refactoringguru.cn/design-patterns)、[模式目录](https://refactoringguru.cn/design-patterns/catalog)、[工厂方法](https://refactoringguru.cn/design-patterns/factory-method)。
- 站内笔记：[GoF 设计模式：四条原则与一张模式地图](/notes/gof-design-patterns)、[设计模式与游戏完美开发](/notes/design-patterns-game-dev)。
- 站内实践：[游戏设计模式实践](/Tech/Architecture/Game_Design_Patterns_Practice)、[Unity 反模式](/Tech/Architecture/Unity_Anti_Patterns)、[塔防索敌重构示例](/Tech/Code_Snippets/TowerTargeting_Refactor_Demo)。
