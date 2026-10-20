# 图学馆 · 《可视化导论》交互讲义

> 五间展厅 + 可视化实验室 —— 用真实数据讲清可视化的原理、色彩与实践。

在线体验：<https://stolenheart-zym.github.io/tuguan/>

《可视化导论》（中国石油大学·华东）课程门户的重构版交互讲义。这里不是图表的陈列柜，而是一间可以动手的教室：每个概念都配一个**能改参数、能看结果**的交互演示，所有数据都是真实公开数据集，每一处结论都标注出处。

## 结构 · Structure

```
门厅   index.html     五间展厅导航 + 由真实数据绘制的封面缩略图
第一展厅 ch01.html     数据：Stevens 四尺度、DIKW 金字塔、Data-Join
第二展厅 ch02.html     可视化流程：Card 数据流模型、d3.rollup
第三展厅 ch03.html     色彩：三类 colormap、Okabe-Ito 配色、色盲模拟
第四展厅 ch04.html     低维数据：坐标变换、曲线拟合、Banking 45°
第五展厅 ch05.html     时序数据：时间五属性、日历热图、Storyline
实验室   lab.html      图表明鉴、配色检影、感知测谎仪等工具集
```

## 技术 · Tech

- 纯前端、零构建：HTML + CSS + ES Modules
- D3.js v7 本地内置，无任何外链请求
- 无后端、无追踪，离线可完整运行（双击 `index.html` 即可）
- 学习进度本地持久化（localStorage）

## 数据 · Data

全部为真实公开数据集，随站内置于 `data/` 目录，每处图表均标注来源：
seaborn 经典集（flights / penguins / anscombe / tips / iris）+ 课程原站数据（newstudent / crime）。
