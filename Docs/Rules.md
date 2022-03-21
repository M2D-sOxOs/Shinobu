# Kokorowatari 抓取规则规范

本文档中的规则指的是 Kokorowatari抓取规则(以下简称: KCR).

通过本文档可以快速的了解 KCR 的规范与结构.

## 为什么需要 KCR

> 一言蔽之, 我们需要一套能够快速根据配置来进行调整的动态抓取引擎以便于适应突发的变化以及更高的可用性.

通过设计 KCR, 我们可以通过规则的形式来对目标数据进行拆包解析, 与此同时, 我们可以将部分高时间成本的工作下分到低成本的团队(运维)而不总是需要麻烦单一职能团队来达成一些小修小改.

简单地说, 通过 KCR 可以实现: 快速/廉价/高效 的数据抓取.

而对于 Shinobu 而言的最终目标是能够将所有对外可以自动化的部分全部收入囊中, 可能在未来的某个时间节点上可以实现依靠运维团队的完整维护流程.

## 基本规范

KCR 使用了键值对来存储具体规则, 一系列用于描述 KCR 整体结构的类型定义如下:

``` typescript
type Expression = string;

type Table<T> = { [k:string]: T };

type Proxy = {
  Server: string,
  Port: number
};

type Client = {
  Host: string,
  Headers: Table<string>
};

type Condition = {
  Value: Expression,
  Symbol: 'EQUAL' | 'NOT_EQUAL',
  Expect: Expression
};

type Result = {
  Type: 'SIMPLE' | 'TABLE' | 'ARRAY',
  Value: Expression
};

type Command = {
  Client: Client | Expression,
  Cache?: Expression,
  Request: {
    Method: 'GET' | 'POST',
    URL: string,
    Parameters: Table<Expression>,
    Forms: Table<Expression>
  }
  Type: 'JSON' | 'DOMS' | 'DOMD',
  JSON?: {
    Indicator: (Condition | 'OR' | 'AND')[],
    Result: Result
  },
  DOM?: {}
};

type Flow = {
  Proxy: Expression,
  Flow: Expression[],
  Failover?: Expression,
  Cache: {
    Mode: 'PASSIVE' | 'ACTIVE',
    Key: Expression[],
    Expire: string
  }
}

type Platform = {
  Clients: Table<Client>,
  Commands: Table<Command>,
  Flows: Table<Flow>
};

```

所有的 KCR 节点都严格遵守 Domain. Name 的结构, 如 Platforms. Mercari.

## Expression

Expression 是用于 KCR 中动态数据查找的表达式, 通过 前缀 + 路径 的方式来将值指向另一个值.

Expression 类型兼容 string, 如果 Expression 处理器无法转义表达式, 将会作为普通字符串处理.

Expression 通过提供了一种 类似于变量 的机制可以显著提升规则可维护性防止同一数据多次在 KCR 中重复引用.

目前 Expression 支持匹配 5 种不同类型的模式:

| 模式 | 描述 |
| ---- | --- |
| \*   | 静态引用, Expression 将直接被展开为指向的内容, 如果指向的是一个外部变量, 那么静态引用的内容在源变量内容发生变动后将不会同步发生变化(可能由于内存共享并不严格). |
| $    | 动态引用, Expression 将在使用时被替换为指向的内容. |
| @    | Mock 引用, 需要指向一个受支持的 Mock 方法, 具体语法为 Mock: Key, Key 控制了该 Mock 值在当前会话中的复用. |
| \#   | 结果引用, 需要指向一个 Commands. Command, Kokorowatari 将会执行该 Command 并使用他的结果作为值进行替换. |
| ^   | 结果引用, 需要指向一个 Flows. Flow, Kokorowatari 会通知 Koyomi 执行该 Flow 并使用他的结果作为值进行替换(这会导致严重的缓存越界). |

Expression 作用域为 Platforms, 如: $Mercari. Clients. API 将会指向 Platforms. Mercari. Clients. API. 理论上您可以访问到 Platforms 下任意的数据.

与此同时, 您可以通过下面这些特殊域来访问一些特殊的数据, 这些域仅允许作为动态引用.

| 模式 | 描述 |
| ---- | --- |
| \_\_IN\_\_  | 用户输入的数据 |
| \_\_OUT\_\_ | 接口返回的数据, 如果使用 DOM 则返回 HTML |
| \_\_RESULT\_\_ | 最后一个 Command 的结果 |
| \_\_CACHE\_\_ | 会话缓存 Command 中 缓存过期 为 0 的缓存数据 |

## Platform 平台

Platform 是 KCR 规则的根节点, 换而言之, 所有的规则都需要存储在 Platform 中.

同时, Platform 也是用户在使用 Kokorowatari 时的最上层作用于, 用户必须要告诉 Kokorowatari 需要抓取的平台名称且该名称需要与 Platform 中的记录对应.

Platform 中必须包含以下这些 子节点 才能让 Kokorowatari 正确的处理对应的平台.

| 节点 | 描述 |
| ---- | --- |
| Clients  | 客户端 |
| Commands | 抓取命令 |
| Flows    | 抓取链条 |

以下范例中创建了一个空的 Yahoo 平台.

``` json

{
  "Yahoo": {
    "Clients": {},
    "Commands": {},
    "Flows": {}
  }
}
```

### Proxy 流量代理

支持使用本地的 http 代理进行流量转发

``` json
{
  "Fiddler": {
    "Server": "127.0.0.1",
    "Port": 8866
  }
}
```

### Clients 客户端

Kokorowatari 使用 Clients 来模拟不同场景下的 *客户端特性*.

我们以 Mercari 的 Clients 为例来详细描述其中的每个参数的作用.

``` json
{
  "Clients": {
    "API": {
      "Host": "https://api.mercari.jp",
      "Headers": {
        "User-Agent": "Mercari_r/68101 (Android 29; zh; arm-v7a; unknown Custom Phone Build/10.0) DB/13",
        "X-PLATFORM": "android",
        "X-APP-VERSION": "68101"
      }
    }
  }
}
```

| 字段 | 描述 |
| ---- | --- |
| Host    | 使用的地址与协议. |
| Headers | 额外或需要修改的 HTTP 头. |

### Commands 指令

单个的请求解析动作在 Kokorowatari 中被称作指令.

我们分别以 接口 与 页面 两种不同类型的请求为例来描述其中的配置.

``` json
{
  "Commands": {
    "AccessToken": {
      "Client": "*Clients.API",
      "Request": {
        "Method": "POST",
        "Path": "/path",
        "Parameters": {
          "a": "$__IN__.First"
        },
        "Forms": {
          "b": "$__IN__.Last"
        }
      },
      "Type": "JSON",
      "Cache": {
        "Key": ["AccessToken", "$__IN__.b"],
        "Expire": "+1080"
      },
      "JSON": {
        "Indicator": [
          {
            "Value": "$__OUT__.result",
            "Symbol": "EQUAL",
            "Expect": "OK"
          },
          "AND",
          {
            "Value": "$__HEADER__.Status",
            "Symbol": "EQUAL",
            "Expect": "200"
          }
        ],
        "Result": {
          "Type": "SIMPLE",
          "Value": "$__OUT__.data.refresh_token"
        }
      }
    }
  }
}
```

大体上 Command 被分为三部分, 与 Type 无关, Type 相关. 我们可以粗糙的将这两部分理解为 Request 负责组装请求数据, Type 及其相关信息 负责解析响应数据.

Type 无关的部分由三个参数构成:

| 字段 | 描述 |
| ---- | --- |
| Client  | 指定使用的客户端配置 |
| Cache  | Command 缓存配置 |
| Request | 指定请求信息 |

#### Client 客户端

可以使用 Expression 指向已存在的 客户端 或者全新定义.

#### Cache Command 缓存

需要说明的是, Command 中的 Cache 与 Flow 中的 Cache 分属不同的管理器, 所以功能略有不同.

> Command Cache 的作用范围在 Slave 中, 也就是不同 Slave 间的 Command Cache 不共享.
>
> Command Cache 和 Quick Command 机制有本质区别, 关于 Quick Command 的细节请请查阅 Quick Command 文档.

##### Key

Key 是一系列变量参数的融合, 最终缓存的名称将会使用 MD5(Key.join('-')) 的方式来决定.

##### Expire

通过 Expire 的取值变化, Cache 会有几种工作模式:

* +N

类似于时间戳, 但是将会在当前时间戳之后的 N 秒后过期.

* 时间戳

对整个 Flow 有效, 如果当前 Kokorowatari 进程重启或到达该时间戳之后则会失效. 对于 Token 类的存储极其有效.

> 需要注意的是, 缓存会对 Requests 部分进行序列化哈希, 如果哈希发生变化, 将会重新请求, 如果参数中带有时间戳信息, 缓存将失效.

#### Request 请求详情

Kokorowatari 通过以下 4 个 Request 参数来组装需要发送到服务器的请求.

| 字段 | 描述 |
| ---- | --- |
| Method     | HTTP 请求方式. |
| Path       | HTTP 请求路径. |
| Parameters | GET 参数键值对表. |
| Forms      | POST 参数键值对表. |

> 表单数据将使用 x-www-form-urlencoded 编码进行发送.

#### Type

控制了 Kokorowatari 将要使用的 Parser. 目前仅支持 JSON 和 DOM.

DOMS 以及 DOMD 均归属与 DOM, 具体规则请见 DOM 规则文档.

#### JSON

当 Type 为 JSON 时使用的针对 JSON Parser 配置信息.

以 Mercari 的 refresh_token 接口为例:

``` json
{
  "Indicator": [
    {
      "Value": "$__OUT__.result",
      "Symbol": "EQUAL",
      "Expect": "OK"
    },
    "AND",
    {
      "Value": "$__HEADER__.Status",
      "Symbol": "EQUAL",
      "Expect": "200"
    }
  ],
  "Result": {
    "Type": "SIMPLE",
    "Value": "$__OUT__.data.refresh_token"
  }
}
```

配置分为两部分: Indicator 和 Result.

我们可以简单的将 Indicator 理解为标识请求是否成功的一种 Condition 表达式, 将 Result 理解为结果格式处理器.

Condition 在 KCR 的许多地方都有应用, 具体请查阅本文档最后的 Condition 说明

##### Indicator

Indicator 本质上是一个类型为 Conditions 的条件聚合.

如果 Indicator 返回为 FALSE 则整个 Command 视乎失败.

| 字段 | 描述 |
| ---- | --- |
| Value  | 取值表达式. |
| Symbol | 比对符号, 支持: EQUAL, NOT_EQUAL. |
| Expect | 期望的值. |

##### Result

Result 结果处理器将会负责把 Command 的处理结果结构化并根据一定策略进行复用.

Result 的结构本质上是一个 无限级别 分类器. Result 只能处理的结构非常抽象结构, 对于单个二维数组中存在多个不同结构的子项则无法使用 Result 进行处理.

Result 不是必须的选项, 如果只是调用一些忽略返回信息的接口, 那么可以直接省略 Result 部分的配置.

> 当然也并不建议且应该尽可能避免向用户返回此类需要大量逻辑处理的非对称结构, 这将会产生大量 硬代码.

``` json
{
  "Type": "SIMPLE",
  "Value": "$__OUT__.data.refresh_token"
}
```

| 字段 | 描述 |
| ---- | --- |
| Type  | 数据类型. |
| Value | 取值表达式. |

##### Type 目前支持 4 种不同类型, 类型可以嵌套以构建树形结构:

* SIMPLE

简单取值, 作为字符串处理.

* TABLE

作为键值对处理, Value 应为一个键值对对象, 以下为例:

``` json
{
  "Type": "TABLE",
  "Value": {
    "Http": {
      "Type": "TABLE",
      "Value": {
        "Status": {
          "Type": "SIMPLE",
          "Value": "$__HEADER__.Status"
        }
      },
    },
    "DataResult": {
      "Type": "SIMPLE",
      "Value": "$__OUT__.result"
    }

  }
}
```

以上的定义将会输出一个类似以下结构的结果对象:

``` json
{
  "Http": {
    "Status": "200"
  },
  "DataResult": "OK"
}
```

* ARRAY

作为数组处理, Value 应为一个 Result 对象, 不支持混合数据结构同时存在于一个数组中, 同时 ARRAY 需要提供一个 Map. From 参数指向一个现有的数组, 同时 Map. To 可以为遍历项目设置一个名称, 在 Value 参数中可以使用这个名称来访问每一个数组对象. Map. To 必须以 单个中划线 开头.

``` json
{
  "Type": "ARRAY",
  "Map": {
    "From": "$__OUT__.data",
    "To":  "-i"
  },
  "Value": {
    "Type": "SIMPLE",
    "Value": "$-i.id"
  }

  }
}
```

以上的定义将会输出一个类似以下结构的结果数组:

``` json
[
  1,
  2,
  3
]
```

### Flows 工作流

由于现实中的单个用户操作可能对应了一堆的接口请求, 所以 Koyomi 实际会给 Kokorowatari 分配的是 Flow 请求.

Flow 目前控制了 4 个部分的工作:

| 字段 | 描述 |
| ---- | --- |
| Proxy  | 流量代理. |
| Flow  | 指令流. |
| Cache  | 缓存. |
| Failover | 故障转移. |

由于横跨两个部分的特性, Flow 是由 Kokorowatari 来处理的, Failover 和 Cache 是由 Koyomi 来管理. 也正是因为如此, 所以 Flows 中不允许使用抓取到的结果数据, 比如: $\_\_OUT\_\_. 但是与此同时, Flow 中可以使用 $\_\_RESULT\_\_ 来获取最后一个 Command 的返回数据.

``` json
{
  "Flows": {
    "Catalog-Fetch-DOM": {
      "Proxy": "*Proxies.Luminati",
      "Flow": [ "*Commands.Catalog" ],
      "Failover": "*Flows.Catalog-Fetch-JSON",
      "Cache": {
        "Mode": "PASSIVE",
        "Key": [ "$__IN__.A", "$__IN__.B" ],
        "Expire": "+3600"
      }
    }
  }
}
```

#### Flow 指令流

指令流相对简单, 表达式数组的顺序构建出一个 Command 的执行顺序, 任何一个 Command 失败将会视作整体失败.

#### Failover 故障转移

可以简单地理解为如果 Flow 失败了则执行另一个 Flow, 如果没有 Failover 方案将会直接返回 NO_MORE_FAILOVER 错误.

#### Cache 缓存管理

Flow 的缓存设置相对复杂

| 字段 | 描述 |
| ---- | --- |
| Mode  | 缓存模式. |
| Key   | 缓存名称. |
| Expire | 缓存过期. |

##### Mode

目前支持 2 种缓存模式 PASSIVE 以及 ACTIVE. 他们唯一的区别是 PASSIVE 使用延后更新, ACTIVE 使用主动更新.

这将会影响缓存到期之后的用户行为, ACTIVE 模式缓存过期后 Koyomi 将会自动发起一个获取程序去更新这个缓存, 但是对于用户而言, 这个过程是无感的, 如果在缓存已过期的同时有用户发起请求则该用户取到的数据依然是过期的缓存数据.

> 假如单次拉取数据耗时 3s, 缓存时间 100s, 那么 ACTIVE 模式下用户的数据时效性为 &lt; 103s

如果为 PASSIVE 则大不相同, 一旦 PASSIVE 缓存到期, 新的用户请求将会直接触发重新抓取程序.

> 直观的体验就是: 缓存生效时用户调用接口可能耗时 1s, 但是如果缓存已经过期了则可能耗时 3s.

需要注意的是, 缓存管理器将会负责这些工作而不是 Koyomi 直接负责, 两种模式的差异其实是在于缓存处理器的行为, 缓存管理器会删除 PASSIVE 缓存或发起 ACTIVE 缓存拉取而并不是想象中的用户在发起请求时判断.

##### Key

与 Command. Key 一样, Key 是一系列变量参数的融合, 最终缓存的名称将会使用 MD5(Key.join('-')) 的方式来决定.

##### Expire

缓存过期时间, 可接受值有两种:

* +N

类似于时间戳, 但是将会在当前时间戳之后的 N 秒后过期.

* 时间戳

将会在指定时间过期.

## Condition 条件
