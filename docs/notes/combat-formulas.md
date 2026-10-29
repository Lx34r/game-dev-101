---
title: "战斗公式：从固定 K 到动态 K"
description: "用动态 K 值、防御上限与伤害下限，解决 Roguelite 战斗中的不破防、数值崩坏与成长失真。"
tags: ["module-notes", "numerical", "combat", "defense", "roguelike", "unity"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 战斗公式：从固定 K 到动态 K

<ArticleTags />

战斗公式不是越复杂越好。它要同时满足四件事：伤害可读、成长可感、防御有意义、数值不崩。很多项目在中期出现「打不动」「0 伤害」「堆防御无收益」的问题，根源往往不在某个系数，而在减伤模型与成长曲线不匹配。

本文从「不破防」这个现象出发，比较减法、固定 K 与动态 K 三种模型，给出一套适合 Roguelite 的实现与调参方法。

## 1. 0 伤害从哪里来

最直观的伤害公式是减法：

$$
Damage = \max(0,\ Attack - Defense)
$$

它的问题是断崖。攻击 100、防御 99 时伤害 1；防御 101 时伤害 0。玩家的攻击力只差 1 点，体验却从「能打」变成「完全无效」。

改成比例减伤后，数学上不会归零：

$$
Damage = Attack \times \frac{K}{K + Defense}
$$

这就是很多 MOBA 与 MMO 使用的固定 K 模型。但 `K` 一旦写死，就会在长线成长中失效：

- 前期 `K = 100` 看起来合理，攻击 100、防御 100 时伤害减半。
- 后期防御涨到 5000，攻击仍只有 100 时，伤害只剩 1.96。
- 防御涨到 50000 时，伤害 0.20，取整后就是 0。

所以「不破防」通常不是公式写错，而是 **K 没有跟着攻击与关卡一起成长**。

## 2. 先定战斗节奏，再谈公式

伤害公式服务于 TTK（Time To Kill）。先写清楚目标：

$$
TTK \approx \frac{HP}{DPS \times Mitigation \times CritFactor \times ElementFactor}
$$

可以用一张简单的节奏表约束设计：

| 目标 | 期望 TTK | 说明 |
| - | - | - |
| 普通怪 | 2–5 秒 | 验证清怪效率与技能循环 |
| 精英怪 | 10–20 秒 | 允许一次完整爆发窗口 |
| Boss | 30–90 秒 | 容纳多阶段与机制处理 |
| 失误惩罚 | 1–2 次 | 不靠超长血条制造难度 |

公式的职责，是让不同属性投放都能落回这张表，而不是让玩家在某个阶段突然失效。

## 3. 三种减伤模型

| 模型 | 公式 | 优点 | 风险 |
| - | - | - | - |
| 减法 | `max(0, ATK - DEF)` | 直观、易解释 | 断崖、0 伤害、脆皮秒杀 |
| 固定 K | `ATK × K / (K + DEF)` | 平滑、减伤有上限 | K 写死，长线失效 |
| 动态 K | `ATK × K(ATK, stage) / (K(ATK, stage) + DEF)` | 适配成长、防御相对化 | 需要额外的 K 曲线与验证 |

固定 K 并不是错，它适合成长区间可控的竞技游戏。Roguelite 的问题在于：一局内攻击可能翻十倍，跨局还有永久成长，固定 K 很快就会被防御曲线甩开。

## 4. 固定 K 的失效点

以 `K = 100` 为例：

| 攻击 | 防御 | 固定 K 伤害 | 动态 K（K = 攻击） |
| -: | -: | -: | -: |
| 100 | 0 | 100.0 | 100.0 |
| 100 | 500 | 16.7 | 16.7 |
| 100 | 5000 | 1.96 | 1.96 |
| 100 | 50000 | 0.20 → 0 | 0.20 → 0 |
| 1000 | 500 | 166.7 | 666.7 |
| 1000 | 5000 | 19.6 | 166.7 |
| 1000 | 50000 | 2.0 | 19.6 |

可以看到两个现象：

1. 低攻击打高防御时，两种模型都会趋近于 0，所以 **必须有下限保护**。
2. 高攻击阶段，固定 K 的伤害被压得过低；动态 K 让攻击与防御处于同一量纲，攻击成长能真正兑现。

## 5. 动态 K 的两种做法

### 5.1 K 跟随攻击方

令 `K = Attack`，公式变成：

$$
Damage = Attack \times \frac{Attack}{Attack + Defense}
= \frac{Attack^2}{Attack + Defense}
$$

这类「攻防比」公式在经典 MMO 中很常见。它把防御解释为**相对于攻击者的厚度**：同样的防御，面对高攻击单位时价值更低，面对低攻击单位时价值更高。

### 5.2 K 跟随关卡基准

另一种做法是把 K 绑定到关卡期望攻击：

$$
K = \max(K_0,\ ExpectedAttack(floor) \times kRatio)
$$

关卡策划只需要维护「本层期望攻击」与「防御预算」，让 `Defense / K` 落在稳定区间。这样跨层成长不会把减伤推到 99%。

两种方式可以组合：用关卡基准保证宏观曲线，用攻击方 K 保证微观手感。

## 6. 防「不破防」的三道保险

只有动态 K 还不够。整数取整、极端 Build 与越级挑战仍会产生 0 伤害。建议加三道保险：

### 6.1 防御上限

不要让防御无限堆叠，按攻击方设置有效防御上限：

$$
Defense_{eff} = \min(Defense,\ Attack \times R)
$$

`R` 可以取 15–25。它保证「防御再高，也最多把伤害压到某个比例」，而不是无限趋近于 0。

### 6.2 伤害下限

$$
Damage = \max(Damage,\ RawDamage \times floorRatio)
$$

`floorRatio` 建议 3%–8%。低于这个比例时，玩家会感觉「打得动但很吃力」；完全没有下限时，玩家只会感觉「这套 Build 坏了」。

### 6.3 只取整一次

所有中间计算用浮点，最终结算才取整：

```csharp
return Mathf.Max(1, Mathf.RoundToInt(damage));
```

不要在每一步都 `int` 截断，否则 0.6 + 0.6 会被算成 0。下限与取整要放在同一条最终管线里。

## 7. Roguelite 的 K 曲线

Roguelite 的难点是「一局内成长」与「跨局成长」叠加。推荐把 K 拆成三层：

1. **关卡基准 K**：按层数或章节配置，跟随期望攻击。
2. **Build 修正 K**：攻击方极端堆攻时，K 跟随攻击，避免一刀秒。
3. **防御预算**：敌人防御按 `K × defenseRatio` 投放，而不是随手填大数。

一个可执行的预算表：

| 层数 | 期望攻击 | 基准 K | 敌人防御区间 | 目标减伤 |
| -: | -: | -: | -: | -: |
| 1–3 | 100 | 100 | 0–80 | 0%–45% |
| 4–6 | 300 | 300 | 100–300 | 25%–50% |
| 7–10 | 900 | 900 | 400–900 | 30%–50% |
| 11+ | 2500 | 2500 | 1200–2500 | 32%–50% |

减伤目标稳定在 30%–50%，防御才有存在感，又不会变成唯一解。超过 70% 后，玩家的成长反馈会迅速变差。

同时把「穿透」做成独立乘区，而不是继续加防御：

$$
FinalDamage = Damage \times (1 - PenetrationRatio)
$$

穿透负责处理高防目标，防御负责提供生存，两者不要在同一层公式里互相抵消。

## 8. Unity 实现

```csharp
using UnityEngine;

public readonly struct DamageRequest
{
    public readonly float Attack;
    public readonly float Defense;
    public readonly float SkillMultiplier;
    public readonly float CritMultiplier;
    public readonly float ElementMultiplier;
    public readonly float DefenseCapRatio; // 例如 20
    public readonly float MinDamageRatio;  // 例如 0.05
    public readonly float BaseK;           // 例如 10
    public readonly float KRatio;          // 例如 1.0

    public DamageRequest(
        float attack, float defense, float skillMultiplier,
        float critMultiplier, float elementMultiplier,
        float defenseCapRatio = 20f, float minDamageRatio = 0.05f,
        float baseK = 10f, float kRatio = 1f)
    {
        Attack = attack;
        Defense = defense;
        SkillMultiplier = skillMultiplier;
        CritMultiplier = critMultiplier;
        ElementMultiplier = elementMultiplier;
        DefenseCapRatio = defenseCapRatio;
        MinDamageRatio = minDamageRatio;
        BaseK = baseK;
        KRatio = kRatio;
    }
}

public static class CombatFormula
{
    public static int Compute(in DamageRequest request)
    {
        float raw = request.Attack * request.SkillMultiplier;
        float effectiveDefense = Mathf.Min(
            request.Defense,
            request.Attack * request.DefenseCapRatio);
        float k = Mathf.Max(request.BaseK, request.Attack * request.KRatio);
        float mitigation = k / (k + effectiveDefense);

        float damage = raw * mitigation
            * request.CritMultiplier
            * request.ElementMultiplier;

        damage = Mathf.Max(damage, raw * request.MinDamageRatio);
        return Mathf.Max(1, Mathf.RoundToInt(damage));
    }
}
```

几个实现细节：

- `raw` 是技能倍率后的基础伤害，下限也按 `raw` 算，避免高倍率技能被固定数字下限破坏平衡。
- 暴击与元素克制放在减伤之后，作为独立乘区；不要把它们塞进 K。
- 大数值项目用 `double` 或定点数，避免 `float` 在千万级伤害上丢精度。
- 记录 `raw / effectiveDefense / k / mitigation / final`，方便战斗日志与仿真复盘。

## 9. 仿真与验收

公式上线前至少跑三类数据：

1. **TTK 分位数**：P50 / P90 / P99，而不是只看平均值。
2. **下限触发率**：多少比例的攻击落在伤害下限；超过 5% 说明防御墙过高。
3. **防御边际收益**：每增加 100 防御，EHP 提升多少；出现阶跃或负收益就要回查 K。

用一张最小验证表就能发现大多数问题：

| 场景 | 攻击 | 防御 | 期望 | 观察 |
| - | -: | -: | - | - |
| 同级普通怪 | 300 | 200 | 稳定 3 秒 | 不应触发下限 |
| 越级精英 | 300 | 900 | 8–12 秒 | 下限偶尔触发 |
| 极端堆防 | 300 | 9000 | 伤害很低但不为 0 | 上限与下限同时生效 |
| 高攻 Build | 3000 | 900 | 1–2 秒 | 高攻应兑现，不应被 K 锁死 |

如果一套 Build 在多个层数都只能触发下限，问题通常不是「玩家不会配装」，而是 K 与防御预算没有跟随成长。

## 10. 设计检查清单

- K 是否会随关卡或攻击成长？固定 K 的适用范围是否写清楚？
- 防御是否有相对上限？伤害是否有下限？
- 取整是否只发生在最终结算？
- 穿透、暴击、元素是否作为独立乘区，而不是继续加防御？
- TTK 的分位数是否落在目标窗口？
- 下限触发率是否可控？
- 战斗日志是否记录了公式中间量？

公式的终点不是「算出一个数字」，而是让玩家在不同 Build、不同层数下都能感知到成长与取舍。动态 K 的价值，是让攻击与防御始终处在同一张数值地图上，而不是在某个阶段突然失联。

## 参考与延伸

- 视频：[【数值手册03】从《英雄联盟》到《天龙八部》，破译战斗伤害公式的“不崩密码”](https://www.bilibili.com/video/BV1JTzLB3EYG/)，UP：特别的吴庸。本文借用其「不破防 / 动态 K 值」的问题框架，公式、实现与调参表为本站原创整理。
- 相关笔记：[核心数值体系定义手册](/Design/Numerical_Manual)、[战斗系统详解](/Design/Mechanics/Combat_System)、[肉鸽强化系统](/Design/Mechanics/Roguelike_Perks)。
