# DOM 规则文档

> 强烈建议先完成 KCR 规则 文档中的 Command.JSON 部分阅读, 这对理解 DOM 规则非常有帮助.

在 Kokorowatari 中, DOM 又被细分为 DOMD 和 DOMS, 在规则上这两者没有区别, 如果目标页面使用了 JS 动态渲染数据或需要对目标页面进行样式判断, 那么你需要使用 DOMD 来处理对应数据.

技术上 DOMS 使用了 Cheerio 进行解析与处理而 DOMD 使用了 Electron 来进行

> 典型情况下的效率: JSON&gt;DOMS&gt;DOMD

## 基本规范

DOM 规则相较于 JSON 规则复杂了许多, DOM 规则分为 3 个部分来控制整体流程. DOM 的配置结构如下

```typescript

type Condition = {
  Selector?: string,
  Path?: string,
  Method?: string,
  Parameters?: Expression[],
  Symbol?: 'EQUAL' | 'NOT_EQUAL' | 'MATCH',
  Expect?: Expression
};

type Action = {
  Action: string,
  Selector?: string,
  Parameters?: string[]
}

type Result = {
  Selector: string,
  
}

type DOM = {
  Strict: boolean,
  Model?: {
    Data: string,
    Throttle: 99
  },
  Indicator: (Condition|'AND'|'OR'),
  Action?: Action[],
  Result?: Result
}
```

| 字段 | 描述 |
| ---- | --- |
| Strict | 严格验证模式. |
| Model | 文档树模型. |
| Indicator | 页面指示器. |
| Action | 页面动作链. |
| Result | 结果构建规则. |

## Action 动作

> 注意: Action 仅用于 DOMD 且与 Result 互斥. Action 完成后将会直接将页面交于下一个 Command 继续执行. **可以将 Action 理解为一个特殊的 Result**.

KCR 通过模拟一系列动作来完成对页面的操作.

```json
[
  {
    "Action": "Left-Click",
    "Selector": ".Input"
  },
  {
    "Action": "Type",
    "Parameters": ["This is a sample text"]
  }
]
```

> 如果 Type 动作中包含了 utf-8 字符则会导致错误.
>
> 如果确实需要输入复杂文本, 请使用 Paste 方法.

### Strict 严格验证模式

用于 DOM 的 Condition  提供了 Selector / Path 二次验证, 如果 Selector / Path 不符合预期将会直接将整个 Command 标记为失败.

通过 Flow 串联多个严格模式下的 DOM Command 可以解决源站 多版本 灰度测试造成的数据问题.

### Model 文档树模型

对文档进行树形建模并对模型相似度进行打分, 未完成的实验性功能!.

```json
{
  "Data": "Aso3UWIH2iojh3==",
  "Throttle": 99
}
```

Data 是 Base64 之后的参考模型数据.

最终会给出一个满分 100 的相似度评分, 通过设置 Throttle 的值可以控制通过率, 理论上应该不低于 99.

关于文档树模型请查阅 [...](DOM/Modeling.md)

理论上如果使用 Model 则可以不使用 Strict 模式.

### Indicator 页面指示器

不同于 JSON 的清晰易懂的结构化数据, DOM 往往具有一些特别复杂的因素. 通过完善的 Indicator 来确认是否获取到了预期中的页面是非常重要的.

换句话说: JSON Indicator 是用来检测结果是否成功的 而 DOM Indicator 是用来检测页面格式是否是预期的.

与此同时 JSON Condition 与 DOM Condition 的结构也有较大的区别.

```json
{
  "Selector": "body div.Logo",
  "Path": "/body/1",
  "Method": "text",
  "Symbol": "MATCH",
  "Expect": "*Amazon*"
}
```

| 字段 | 描述 |
| ---- | --- |
| Selector | CSS 选择器. |
| Path | 元素绝对路径. |
| Method | 非必须值, 判断方式, 完整目录见 [...](DOM/Methods.md) 文档. |
| Parameters | 非必须值, Method 参数, 视乎 Method 而定. |
| Symbol | 非必须值, 判断符号. |
| Expect | 非必须值, 期望值. |

> Method, Symbol, Expect 必须同时存在或不存在, 如果不定义 Method 且工作于非 Strict 模式, 那么该 Condition 将永远返回 **true**.
>
> 需要注意的是, Strict 模式下 Selector 和 Path 的严格检测并不会因为设置 Method 而被略过.

#### Selector

与传统的 CSS 选择器一致, 在此不做赘述.

如果使用 Path 来查找元素且不使用严格模式来验证 DOM 则可以忽略 Selector.

#### Path

元素标定路径, 判断页面元素是否发生变更的利器.

Path 使用了简单的 XPath 语法来表示元素在页面中的绝对代码位置, 这可以有效地发现 DOM 变化.

如果使用 Selector 来查找元素且不使用严格模式来验证 DOM 则可以忽略 Path.

> Path 不支持属性选择, 只支持路径选择. 远期来看, 属性选择对判断页面元素是否发生变更有害无益.

#### Method

对选定元素执行的数据方法, 例如 text 方法来获取元素的文本内容.

#### Parameters

需要传递给 Method 的参数列表.

#### Symbol

判断方式, 全部的条件可以查阅 [...](DOM/Condition/Symbol.md).

#### Expect

最终期望的值.

### Action 页面动作链

执行页面动作链.

Action 会尽可能的模拟人类操作来防止出现可能的 机器检测.

> 动作链会在页面完成加载后执行

### Result 结果构建

Result 大体与 JSON Result 相似, 但是加入了 Condition 中的 Method 概念.

| 字段 | 描述 |
| ---- | --- |
| Type  | 数据类型. |
| Value | 元素选择器或嵌套 Result. |
| Method | 元素取值方法, 完整目录见 [...](DOM/Methods.md) 文档. |
| Parameters | Method 参数, 视乎 Method 而定. |
