---
title: "四元数与三维旋转：从复数到万向锁"
description: "从复数旋转推出四元数旋转公式，解释双倍覆盖、Slerp 插值与万向锁的真正成因。"
tags: ["module-notes", "math", "quaternion", "rotation", "unity", "animation"]
source: "notes"
sourceName: "GameDev Atlas 笔记"
outline: [2, 3]
---

# 四元数与三维旋转：从复数到万向锁

<ArticleTags />

四元数经常被当成「Unity 里用来避免万向锁的黑盒」。但只要从二维复数出发，旋转公式、双倍覆盖与 Slerp 都可以用很直观的几何推出来；万向锁也不是四元数「修好」的 bug，而是欧拉角这种参数化方式自带的奇点。

这篇笔记按「复数 → 四元数 → 旋转 → 插值 → 万向锁」整理，重点放在能直接用于游戏开发的结论与代码。

## 1. 复数：二维旋转的最小样本

复数写作 $z=a+bi$，其中 $i^2=-1$。把 $z$ 看成平面向量 $(a,b)$，乘以单位复数：

$$
z' = (\cos\theta + i\sin\theta)(a+bi)
$$

结果正好是把向量逆时针旋转 $\theta$。复数乘法同时包含缩放与旋转，单位复数的模长为 1，所以只旋转不缩放。

四元数是复数的三维扩展：它有 **三个虚部**，但不是把 $i$ 简单复制三份，而是让它们之间满足一套非交换的乘法规则。

## 2. 四元数的定义与乘法

四元数可以写成：

$$
q = a + bi + cj + dk,\quad a,b,c,d\in\mathbb{R}
$$

$$
i^2=j^2=k^2=ijk=-1
$$

这个定义直接推出 $ij=k$、$jk=i$、$ki=j$，以及反向乘积带负号。四元数乘法不满足交换律，这一点是它能表示三维旋转的关键。

用标量 + 向量的有序对表示：

$$
q=[s,\mathbf{v}],\quad \mathbf{v}=(x,y,z)
$$

两个四元数的乘积（Hamilton 积）为：

$$
q_1q_2=[s_1s_2-\mathbf{v}_1\cdot\mathbf{v}_2,\;
s_1\mathbf{v}_2+s_2\mathbf{v}_1+\mathbf{v}_1\times\mathbf{v}_2]
$$

模长是四维长度：

$$
\|q\|=\sqrt{s^2+x^2+y^2+z^2}
$$

单位四元数满足 $\|q\|=1$，它的共轭 $q^*=[s,-\mathbf{v}]$ 同时也是逆：$q^{-1}=q^*$。

## 3. 旋转公式：三明治结构

把三维向量 $\mathbf{v}$ 写成纯四元数 $v=[0,\mathbf{v}]$。绕单位轴 $\mathbf{u}$ 旋转角度 $\theta$ 的四元数是：

$$
q=\left[\cos\frac{\theta}{2},\;\sin\frac{\theta}{2}\mathbf{u}\right]
$$

旋转结果为：

$$
v' = qvq^*
$$

这是一个「三明治」：左边乘 $q$，右边乘 $q^*$。为什么角度要除以 2？因为 $q$ 对 $v$ 做了两次作用，一次在左、一次在右；两半合起来才是完整的 $\theta$。这也解释了单位四元数为什么双倍覆盖三维旋转。

把 $qvq^*$ 展开，可以得到与 Rodrigues 公式等价的几何形式：

$$
\mathbf{v}' =
\cos\theta\,\mathbf{v}
+ (1-\cos\theta)(\mathbf{u}\cdot\mathbf{v})\mathbf{u}
+ \sin\theta(\mathbf{u}\times\mathbf{v})
$$

- 平行于旋转轴的分量不变；
- 垂直分量在平面内旋转；
- 叉积项提供旋转方向。

从单位四元数反推轴角也很直接：

$$
\theta = 2\arccos(w),\qquad
\mathbf{u} = \frac{(x,y,z)}{\sin(\theta/2)}
$$

Unity 里的 `Quaternion.AngleAxis(angle, axis)` 就是在构造这个 $q$，`q * vector` 则执行 $qvq^*$。

## 4. 复合与双倍覆盖

如果先应用 $q_1$，再应用 $q_2$，总旋转是：

$$
v'' = q_2(q_1vq_1^*)q_2^* = (q_2q_1)v(q_2q_1)^*
$$

所以 $q_{net}=q_2q_1$，顺序与矩阵复合一致，从右往左读。四元数乘法不可交换，所以旋转顺序不能随便调换。

单位四元数 $q$ 与 $-q$ 表示同一个旋转：

$$
(-q)v(-q)^* = qvq^*
$$

因为负号在左右各出现一次，抵消了。这就是**双倍覆盖**：两个四元数对应一个旋转。矩阵没有这个问题，但四元数在插值时必须处理它，否则可能绕远路旋转接近 360°。

## 5. 插值：Lerp、Nlerp 与 Slerp

对两个旋转 $q_0,q_1$ 做插值，最直接的是线性插值：

$$
q_t = (1-t)q_0 + tq_1
$$

但结果不再是单位四元数。归一化后得到 Nlerp：

$$
q_t = \frac{(1-t)q_0 + tq_1}{\|(1-t)q_0 + tq_1\|}
$$

Nlerp 计算便宜，但角速度不均匀：在弧较长时，中段会明显变快或变慢。

Slerp 对角度做线性插值，保持恒定角速度：

$$
q_t = \frac{\sin((1-t)\theta)}{\sin\theta}q_0
+ \frac{\sin(t\theta)}{\sin\theta}q_1
$$

其中 $\theta=\arccos(q_0\cdot q_1)$。

### 两个实现细节

1. **最短路径**：如果 $q_0\cdot q_1<0$，先把 $q_1$ 取反，再插值。否则四元数会沿长弧旋转，表现为「转了一大圈」。
2. **小角度保护**：$\theta$ 接近 0 时 $\sin\theta$ 接近 0，直接除会数值爆炸。此时退回 Nlerp，误差可以忽略。

```csharp
public static Quaternion SlerpShortest(Quaternion a, Quaternion b, float t)
{
    if (Quaternion.Dot(a, b) < 0f)
        b = new Quaternion(-b.x, -b.y, -b.z, -b.w);

    float dot = Mathf.Clamp(Quaternion.Dot(a, b), -1f, 1f);
    if (dot > 0.9995f)
        return Quaternion.Normalize(Quaternion.Lerp(a, b, t));

    return Quaternion.Slerp(a, b, t);
}
```

多个关键帧之间直接逐段 Slerp，切换点会出现角速度断点；需要更平滑的曲线时，可以用 Squad 或样条插值，代价是实现与调参更复杂。

## 6. 万向锁：固定旋转顺序的奇点

欧拉角把三维旋转拆成绕三个轴的连续旋转，例如固定顺序：

$$
E(yaw,pitch,roll)=R_z(yaw)R_y(roll)R_x(pitch)
$$

这三个矩阵的顺序固定，像三个嵌套的万向节。大多数角度下，它们分别控制三个独立的轴；但当中间轴转到 $\pm90°$ 时，第一和第三旋转轴会在世界空间中重合。

以 $x-y-z$ 顺序、$y$ 轴转 $90°$ 为例：

$$
R_z(\beta)R_y(\tfrac{\pi}{2})R_x(\alpha)
= R_y(\tfrac{\pi}{2})R_x(\alpha-\beta)
$$

原本三次旋转被化简成两次，$x$ 与 $z$ 的控制合并为一个差值 $\alpha-\beta$。此时无论怎么调这两个角，都无法独立控制最初的两个方向，一个自由度消失了。

关键点是：

- **万向锁不是物体不能旋转**，而是欧拉角这组参数无法再唯一、独立地表达所有旋转；
- 它来自「固定顺序的三次轴旋转」这个表示方式，不来自三维空间本身；
- 增加第四个万向节只能降低发生概率，不能根除；
- 四元数没有固定轴顺序，因此不会出现这种参数奇点，但仍然需要归一化、处理双倍覆盖与数值误差。

在 Unity 中，`Transform.eulerAngles` 是四元数的欧拉角投影。读取它、修改其中一个角、再写回，本质上仍然是在欧拉角空间里操作；如果中间角接近 ±90°，就可能出现轴向合并或跳变。需要稳定朝向时，应该存储和组合 `Quaternion`，而不是每帧拆成欧拉角再拼回去。

## 7. Unity 实践

### 7.1 优先存储四元数

```csharp
// 推荐：直接保存旋转
public Quaternion AimRotation;

// 不推荐：把姿态拆成三个 float 每帧重建
public Vector3 EulerAngles;
```

`Quaternion.Euler` 适合从策划配置或相机输入构造初始旋转，不适合作为运行期的唯一状态。

### 7.2 常用 API 的语义

| API | 用途 |
| - | - |
| `Quaternion.AngleAxis(angle, axis)` | 绕轴构造旋转 |
| `Quaternion.LookRotation(forward, up)` | 由朝向构造旋转 |
| `Quaternion.FromToRotation(from, to)` | 两个方向之间的最短旋转 |
| `Quaternion.Slerp(a, b, t)` | 球面插值 |
| `Quaternion.RotateTowards(a, b, maxDegrees)` | 限速转向 |
| `Quaternion.Inverse(q)` | 反向旋转 |
| `q * vector` | 用四元数旋转向量 |

### 7.3 相机与角色朝向分开

角色通常只需要一个朝向四元数；相机可能需要 yaw/pitch 两个标量来做鼠标输入。此时可以保留两个角度，但在应用到 Transform 时组合成四元数：

```csharp
Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
transform.rotation = rotation;
```

把 pitch 限制在 $(-89°, 89°)$ 可以避开相机俯仰的 90° 奇点。如果镜头需要完整球面自由度，就改用四元数增量旋转，而不是修改欧拉角。

### 7.4 矩阵还是四元数

- 单个旋转的组合、插值、求逆：四元数更合适；
- 大批量顶点/骨骼变换：预计算矩阵更高效；
- 需要与平移、缩放复合时：最终仍要转成矩阵；
- 物理引擎或外部库只接受矩阵时：在边界处转换，内部保持四元数。

## 8. 检查清单

- 是否把欧拉角当成了运行期姿态存储？
- 插值前是否处理了 $q$ 与 $-q$ 的最短路径？
- 小角度 Slerp 是否退回 Nlerp 以避免除零？
- 相机 pitch 是否限制在 ±90° 以内，或使用四元数增量？
- 旋转复合顺序是否与矩阵/父级空间一致？
- 是否定期归一化累积旋转，避免数值漂移？
- 大批量变换是否使用矩阵，而不是逐个四元数乘向量？
- 调试时是否能同时看到四元数、轴角与欧拉角，而不是只看其中一个？

四元数不是「更高级的欧拉角」，而是另一种旋转表示：它用四维单位球面上的点编码三维旋转，代价是双倍覆盖与抽象性，收益是无奇点、可插值、易复合。理解三明治公式与万向锁的成因，比记住 API 更重要。

## 参考与延伸

- 《四元数与三维旋转》，Krasjet。本文的复数类比、三明治公式与 Slerp 推导参考该教程；示例代码：[Krasjet/quaternion](https://github.com/Krasjet/quaternion)。
- 《Bonus: Gimbal Lock》，Krasjet。万向锁的矩阵化简与固定顺序解释参考该 Bonus 章节。
- 相关文档：[Unity Transform 数学指南](/Tech/Mechanics/Unity_Transform_Math_Guide)、[Shader 数学模式](/Tech/Graphics/Shader_Math_Patterns)、[游戏曲线深度解析](/Tech/Math/Game_Curves_DeepDive)。
