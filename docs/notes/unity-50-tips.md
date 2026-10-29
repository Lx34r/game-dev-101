---
title: "Unity 工程化清单：从 50 条技巧里留下真正耐用的部分"
description: "从 2016 版 Unity 50 条最佳实践中提炼项目结构、Prefab、ScriptableObject、调试与性能的耐用规则。"
tags: ["module-notes", "unity", "architecture", "testing", "performance", "team"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# Unity 工程化清单：从 50 条技巧里留下真正耐用的部分

<ArticleTags />

《50 Tips for Working with Unity》最早写于 2012 年，2016 年做过一次修订。它的价值不在于「50 条必须遵守」，而在于它把 Unity 项目里最常见的混乱总结成了可检查的工程习惯。

这篇笔记把原清单按工作流、代码边界、Prefab/ScriptableObject、调试与性能重新分组，只保留今天仍然耐用的部分，并标注哪些建议已经过时。

## 1. 先定尺度，再谈资产

项目一开始就应确定统一尺度：

- 3D 项目通常 1 Unity 单位 = 1 米；
- 不使用光照/物理的 2D 项目可以用 1 单位 = 1 设计分辨率像素；
- UI 先定设计分辨率（HD 或 2xHD），所有素材按同一尺度制作。

尺度不一致的代价通常在后期才出现：动画缩放错位、碰撞体比例不对、UI 在不同分辨率下崩坏。改资产比一开始定规则贵得多。

## 2. 让每个场景都能独立运行

开发期最浪费时间的动作之一，是为了测试一个小功能而必须从主菜单一路点到目标场景。

做法是让持久对象在缺失时自动创建，例如用启动器/服务定位器把 Manager 拉起来。这样任何场景按 Play 都能进入可测试状态，关卡美术也能独立验收。

注意副作用：自动创建的单例容易在测试收尾时残留，需要有明确的销毁与重置路径。

## 3. 版本控制要配合场景与 Prefab

Unity 的 Scene/Prefab 很难像代码一样平滑合并。可执行的做法：

- 资产序列化为文本，至少能看清改了什么；
- 同一时间只让一个人修改同一个 Scene/Prefab，用「场景令牌」之类的约定；
- 分支策略要围绕 Scene/Prefab 的独占修改设计；
- 临时测试资产提交后要清理，不要留在主分支。

这些是流程规则，不是编辑器功能。工具再好，也替代不了「谁在改哪个场景」的约定。

## 4. 代码边界：命名空间、断言与字符串

- **所有代码放进命名空间**，避免与第三方插件冲突；但不要用 `Object`、`Action`、`Event` 这类过宽的名字。
- **用断言表达不变量**：`Debug.Assert` 或 `Unity.Assertions.Assert` 适合捕获「理论上不可能」的状态。
- **字符串只用于显示文本**。对象标识、Prefab 名、动画名不要用裸字符串；必须用时集中成常量或嵌套类，例如 `AnimationNames.Player.Run`。
- **不要用 `Invoke` / `SendMessage` 做主要通信**。按名字调用难以追踪引用，重构时容易静默断链。

### 防御式 GetComponent

`GetComponent` 失败时返回 null，随后在很远的地方才炸。可以在调用点集中处理：

```csharp
public static T Require<T>(this GameObject go) where T : Component
{
    var component = go.GetComponent<T>();
    if (component == null)
        Debug.LogError($"Missing {typeof(T).Name} on {go.name}", go);
    return component;
}
```

这不是鼓励到处 `GetComponent`，而是让「组件缺失」在发生点被看见。

## 5. 时间与暂停要抽象

直接读 `Time.deltaTime` 的代码很难支持暂停、慢动作或独立 UI 时钟。可以维护一个自己的时间服务：

```csharp
public static class GameTime
{
    public static float DeltaTime { get; private set; }
    public static bool Paused { get; set; }

    public static void Tick(float unscaledDelta)
    {
        DeltaTime = Paused ? 0f : unscaledDelta * Time.timeScale;
    }
}
```

需要更新的自定义类应接收 `deltaTime` 参数，而不是自己读全局时间。这样同一套逻辑可以跑在游戏时间、UI 时间或回放时间上。

## 6. Inspector 是配置，不是状态

- 在 Inspector 中可调的字段是**配置**，不要把它当运行期状态反复写回；
- 只暴露需要设计师调整的字段，其余用 `[SerializeField]` + `[HideInInspector]`；
- 用 `[Header]`、`[Tooltip]`、`PropertyDrawer` 提升可读性；
- 能用 PropertyDrawer 解决的就不要写 CustomEditor，前者按类型复用，后者按 MonoBehaviour 重复。

### ScriptableObject 的四种用法

1. **共享配置**：武器表、敌人参数、掉落表；
2. **关卡数据**：比 XML/JSON 更容易在 Inspector 中编辑；
3. **行为配置**：把方法/策略作为资产注入；
4. **Prefab 特化**：两个对象只有少量配置不同，用 SO 区分，而不是复制两个实例改字段。

配合 `[CreateAssetMenu]`，可以让策划直接在 Asset 菜单创建数据资产。

## 7. Prefab 规则

- 场景里除文件夹外，尽量一切都是 Prefab；
- **链接 Prefab，不要链接 Prefab 实例**：实例引用在复制/替换时容易断；
- 如果 Prefab 根节点是 Mesh，想替换 Mesh 又不丢脚本配置，就在 Mesh 外再包一层空根节点，把脚本放在根上；
- 动态生成的对象统一挂到一个 `DynamicObjects` 根节点下，避免运行时 Hierarchy 爆炸。

## 8. 用状态机替代状态布尔

当 `Update` 里出现越来越长的 `if/switch`，或者出现 `hasShownGameOverMessage` 这类标记，就该考虑状态机：

- 每个状态只关心进入、退出与更新；
- 状态切换集中处理；
- 避免多个布尔量组合出非法状态。

轻量状态机不需要框架，一个字典 + 当前状态 + 转换表就够。

## 9. 调试设施要提前建

- **单元测试**：算法、数值、解析、状态转换优先写测试；
- **可视化调试**：把关键数值画成曲线，定位偶发漂移与抖动；
- **分类日志**：按系统着色/过滤，避免 Console 变成噪声；
- **截图快捷键**：视觉 bug 用图说话；
- **状态快照**：一键打印玩家、敌人、AI 的关键状态；
- **调试键集中定义**：避免与正式输入冲突。

这些工具在项目中期会成倍回报，尤其是「偶发但致命」的 bug。

## 10. 性能建议要分时代

2016 版里仍然有效的部分：

- 先测量再优化，使用 Profiler 找热点；
- 避免高频分配，关注 GC；
- 对象池复用在子弹、特效、UI 项上仍然有效；
- 合批、图集、减少 Overdraw 仍然是渲染优化的基础。

已经过时的部分：

- `WWW` 已被 `UnityWebRequest` 取代；
- 旧版 Prefab 嵌套限制已经改善；
- 属性抽屉与编辑器工具比当年成熟，很多「必须写自定义编辑器」的场景已不需要；
- 具体 API 的 GC 行为随版本变化，必须以当前 Unity 版本的 Profiler 为准。

## 11. 命名与目录

- 统一命名规范（PascalCase / camelCase / 前缀）；
- 按职责分目录，而不是按文件类型堆在一起；
- 第三方插件放在独立目录，升级时不要污染业务代码；
- 场景、Prefab、ScriptableObject 的命名要能表达用途，而不是 `New Object 1`。

## 12. 可直接执行的检查清单

- 项目尺度、设计分辨率是否写进规范？
- 每个场景能否独立 Play？
- Scene/Prefab 是否有明确的独占修改约定？
- 代码是否全部在命名空间内？
- 是否还在用字符串标识对象或动画？
- 时间是否经过统一服务，暂停能否覆盖所有系统？
- Inspector 字段是否只包含配置，不混入运行期状态？
- 共享数据是否用 ScriptableObject，而不是复制 Prefab？
- 动态对象是否有统一根节点？
- 算法与数值是否有测试？
- 是否有可视化调试与分类日志？
- 是否还在照搬 2016 年已过时的 API 建议？

这 50 条技巧的真正价值，是提醒你「项目结构、可测试性与调试设施」也是游戏功能的一部分。团队 3 人和 20 人、Game Jam 和长线项目，需要的规则不同；先选适合当前规模的规则，再坚持执行。

## 参考与延伸

- 原文：[50 Tips for Working with Unity (2016 Edition)](http://devmag.org.za/2012/07/12/50-tips-for-working-with-unity-best-practices/)，Herman Tulleken。
- 参考笔记：《Unity 的 50 个技巧和最佳实践（2016 版）》《unity 的一些重要技巧》。本文为独立整理与现代化取舍。
- 相关文档：[Unity 反模式](/Tech/Architecture/Unity_Anti_Patterns)、[Unity 实战锦囊](/Dev_Guides/Unity_Practical_Tips)、[Unity 高级 C# 性能](/Tech/Optimization/Unity_Advanced_CSharp_Performance)。
