---
title: "双摇杆射击的辅助瞄准：从死区到自动瞄准"
description: "拆解双摇杆瞄准的输入死区、朝向插值、粘性瞄准、自动瞄准与角度判定，并给出 Unity 实现。"
tags: ["module-notes", "input", "aim", "combat", "camera", "unity"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 双摇杆射击的辅助瞄准：从死区到自动瞄准

<ArticleTags />

双摇杆射击看起来只是「左摇杆移动、右摇杆射击」，真正做起来却会同时撞上输入噪声、朝向抖动、辅助瞄准抢操作和镜头干扰。FPS 的很多手感技巧不能直接搬过来，因为两者的输入模型不同。

这篇笔记按输入 → 朝向 → 辅助 → 镜头四层拆解，给出可以直接落地的判定方式与 Unity 代码。

## 1. 双摇杆不是 FPS 的摇杆

FPS 的准星通常是一组屏幕坐标，摇杆负责推动它；双摇杆的射击方向则直接对应右摇杆的朝向。由此产生三个差异：

1. **模拟 vs 数字**：双摇杆的输入方向就是射击方向，方向和强度都有连续含义；FPS 的准星位置与摇杆位置并不一一对应。
2. **持续按住**：FPS 可以把准星放好再松手，双摇杆必须一直按住右摇杆维持朝向。
3. **按键冲突**：右摇杆占用了右手拇指，瞄准期间可用的动作必须移到肩键或扳机，正面按键不应承担高频操作。

这意味着瞄准系统的第一目标不是「更准」，而是「在持续输入下保持稳定、可预期」。

## 2. 输入层：先做对径向死区

摇杆静止时也会输出噪声，常见在 `0.05–0.15` 之间。如果直接把原始值喂给角色，角色会在原地抽搐。

错误做法是分别判断两个轴：

```csharp
// 错误：x、y 各自过阈值，斜向会提前触发，方向也会被扭曲
if (Mathf.Abs(x) > deadzone || Mathf.Abs(y) > deadzone) { ... }
```

正确做法是把输入当作二维向量，用**模长**做径向死区：

$$
\vec{v} = (x, y),\quad m = |\vec{v}|,\quad
\vec{v}' = \frac{\vec{v}}{m} \cdot \text{clamp}\left(\frac{m - dz}{1 - dz}, 0, 1\right)
$$

```csharp
public static Vector2 ApplyRadialDeadzone(Vector2 raw, float deadzone)
{
    float magnitude = raw.magnitude;
    if (magnitude <= deadzone) return Vector2.zero;
    float strength = Mathf.InverseLerp(deadzone, 1f, magnitude);
    return raw.normalized * strength;
}
```

径向死区保证：

- 阈值内完全无输入；
- 过阈值后方向不变；
- 强度从 0 连续增长，不会在边界跳变。

如果觉得边界仍有台阶，可以在 `strength` 上再套一条曲线，例如 `strength = Mathf.Pow(strength, 0.8f)`。但先不要加太多层，死区本身解决的是噪声，不是手感。

## 3. 朝向层：目标方向与显示方向分离

把摇杆方向直接赋给角色朝向，会产生锯齿式转向。更稳的结构是维护两个角度：

- **targetAngle**：由输入直接计算出的目标方向；
- **viewAngle**：实际显示与射击使用的方向，以有限角速度追向 targetAngle。

$$
\theta_{view} \leftarrow \theta_{view} + \text{sign}(\Delta)\cdot\min(|\Delta|,\ \omega \cdot \Delta t)
$$

其中 `Δ = wrap(targetAngle - viewAngle)`，`ω` 就是瞄准灵敏度。高灵敏度响应快但精度低，低灵敏度更准但转身慢。

```csharp
public static float RotateTowards(
    float current, float target, float degreesPerSecond, float deltaTime, float minDelta)
{
    float delta = Mathf.DeltaAngle(current, target);
    if (Mathf.Abs(delta) <= minDelta) return current;
    float step = Mathf.Min(Mathf.Abs(delta), degreesPerSecond * deltaTime);
    return current + Mathf.Sign(delta) * step;
}
```

`minDelta` 用来吸收硬件抖动：当目标与当前朝向只差极小的角度时，不推动 viewAngle。没有这个门槛，静止时准星会持续微颤。

### 粘性瞄准：靠近目标时放慢

Sticky Aim 的思路不是把准星吸到敌人身上，而是在准星接近目标时降低角速度，让玩家更容易停在目标上。

```text
if angularDistance(viewAngle, targetAngle) < stickyAngle:
    turnSpeed *= stickyFactor   // 例如 0.25–0.5
```

它适合微调，不适合快速切换目标。粘性范围过大会让玩家觉得「摇杆推不动」，所以通常只在目标附近生效，并允许在设置中关闭。

## 4. 自动瞄准：要么隐形，要么明确

辅助瞄准常见两类：

| 方式 | 行为 | 玩家感受 |
| - | - | - |
| 粘性瞄准 | 靠近目标时减速 | 更稳，但仍是自己在瞄 |
| 自动瞄准 | 直接修正朝向到目标 | 更准，但可能「枪自己在动」 |
| 扩大命中盒 | 判定更宽松 | 最隐形，难以感知 |
| 视觉反馈 | 激光变色 / 准星锁定 | 明确告知辅助已生效 |

最危险的实现是「持续偏移」：在玩家输入方向之外额外加一个 auto-aim offset，让 viewAngle 慢慢推向敌人。目标死亡或离开范围后，输入方向与显示方向之间会留下差值；如果平滑归零，玩家会觉得准星在自己移动；如果保留差值，连续交战后偏移会越积越大，同样的摇杆方向会得到不同结果。

更可控的方案是：

- 只在**捕获目标的一瞬间**把朝向吸附到目标角度；
- 把辅助角度限制在较窄的范围内，例如 30°；
- 同时改变激光颜色或准星形态，明确告诉玩家「辅助正在生效」；
- 提供关闭选项。

这打破了「所有朝向都必须插值」的教条，但换来了可预期性。玩家能接受被明确告知的辅助，难以接受无法解释的偏移。

## 5. 角度判定：距离不能改变辅助强度

早期实现常直接比较「输入方向与目标中心方向的夹角」，小于阈值就触发自动瞄准。这个做法会产生一个反直觉结果：**距离越远，越容易触发**。

原因很简单：远处目标在屏幕上的角尺寸更小，同样的物理偏移对应的中心夹角更小；用固定角度阈值判断，等价于让远距离目标获得更大的容错。

更合理的做法是把目标视为一个圆，先算它的角半径：

$$
\theta_{radius} = \arctan\left(\frac{targetRadius}{distance}\right)
$$

$$
error = \left|\Delta(\theta_{input}, \theta_{target})\right| - \theta_{radius}
$$

只有当 `error <= assistCone` 时才触发辅助。这样：

- 近距离目标角半径大，容错自然更大；
- 远距离目标角半径小，需要更精确地对准；
- 判定与目标的实际体积相关，而不是与屏幕距离相关。

```csharp
public readonly struct AimTarget
{
    public readonly Vector2 Position;
    public readonly float Radius;
    public AimTarget(Vector2 position, float radius)
    {
        Position = position;
        Radius = radius;
    }
}

public static AimTarget? FindAssistTarget(
    Vector2 player, float inputAngleDeg, float range, float assistConeDeg,
    IReadOnlyList<AimTarget> targets)
{
    AimTarget? best = null;
    float bestError = float.MaxValue;

    foreach (var target in targets)
    {
        Vector2 toTarget = target.Position - player;
        float distance = toTarget.magnitude;
        if (distance > range || distance < 0.001f) continue;

        float targetAngle = Mathf.Atan2(toTarget.y, toTarget.x) * Mathf.Rad2Deg;
        float centerDelta = Mathf.Abs(Mathf.DeltaAngle(inputAngleDeg, targetAngle));
        float angularRadius = Mathf.Atan2(target.Radius, distance) * Mathf.Rad2Deg;
        float effectiveError = centerDelta - angularRadius;

        if (effectiveError <= assistConeDeg && effectiveError < bestError)
        {
            bestError = effectiveError;
            best = target;
        }
    }
    return best;
}
```

选中目标后，是否吸附取决于模式：辅助模式只降低角速度，完整模式把 viewAngle 直接设为目标角度，并触发一次视觉反馈。

## 6. 镜头与准星也会影响瞄准

双摇杆的镜头通常跟随「玩家与瞄准点之间的甜点」。这会让瞄准方向同时驱动镜头，带来两个问题：

1. 玩家快速换向时镜头抢动，画面产生额外位移；
2. 自动瞄准改变朝向时，镜头跟着跳。

常见修补是按条件忽略瞄准点：玩家正在移动、右摇杆处于死区、或准星距离低于阈值时，镜头不跟随瞄准点。它不优雅，但有效。

数字准星可以进一步帮助玩家感知输入：

- 准星与角色的距离由摇杆模长决定，模长越大准星越远；
- 设置最小与最大距离，避免准星贴脸或飞出屏幕；
- 自动瞄准锁定时让准星贴到目标上，同时保持镜头稳定。

镜头的 ease-in/ease-out 负责把切换目标、进入瞄准模式、松开摇杆这些事件磨平。优先保证瞄准方向本身可读，再处理镜头装饰。

## 7. 调参与验收

手感不是一次写对的，而是被测试打磨出来的。可以用下面几个指标驱动迭代：

- **死区边界**：静止 10 秒，角色与准星是否完全不动；
- **转向延迟**：从满推摇杆到 viewAngle 到位的时间，是否在 0.12–0.25 秒；
- **粘性强度**：目标附近是否能微调，还是像被磁铁吸住；
- **辅助触发率**：多少射击在无辅助时完全打不中；辅助开启后是否过高；
- **距离一致性**：近距离与远距离的辅助容错是否符合预期；
- **关闭辅助后的可玩性**：关闭后仍应能完成基础战斗。

测试时让完全陌生的人玩。一个实用的经验是：如果 3 个以上的人独立抱怨同一个问题，它大概率是真问题；如果只有一个人，可能是个人习惯。同时，设计师自己要定期离开项目一周再回来，或者切换键鼠/手柄各玩一段时间，重新感知那些已经麻木的细节。

## 8. 实现检查清单

- 摇杆输入是否使用径向死区，而不是分轴阈值？
- 目标方向与显示方向是否分离，是否有最小角度门槛？
- 粘性瞄准的范围与倍率是否可调、可关闭？
- 自动瞄准是持续偏移还是捕获瞬间吸附？
- 辅助角度是否按目标角半径修正，避免远距离过度触发？
- 辅助生效时是否有明确但不刺眼的视觉反馈？
- 镜头是否会在自动瞄准或快速换向时抢动？
- 是否提供辅助瞄准开关与摇杆死区/灵敏度设置？

双摇杆瞄准的核心不是「加一个自动瞄准」，而是把输入、朝向、辅助和镜头拆成独立层，让每一层都能被单独观测和调参。辅助做得越隐形，越需要清晰的规则；一旦规则会改变玩家对同一输入的预期，就应该让辅助变得可见。

## 参考与延伸

- 原文：[Everything I Learned About Dual-Stick Shooter Controls](https://www.gamedeveloper.com/design/everything-i-learned-about-dual-stick-shooter-controls)，作者分享自 *Relic Hunters Zero* 的开发经验。
- 参考笔记：《游戏双摇杆: 辅助瞄准》。本文为独立整理，公式、判定方式与代码为本站补充实现。
- 相关文档：[Unity 输入系统设计](/Tech/Input_System_Design)、[瞄准辅助系统](/Tech/Mechanics/Aim_Assist_System)、[摄像机设计深度指南](/Art/Camera_DeepDive_And_Settings)。
