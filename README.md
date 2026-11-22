# 后端编程测试：GraphQL API

提交人：张嘉浩

本项目提供一个只读 GraphQL API，用于查询题目提供的聊天机器人配置。技术栈为 Node.js、JavaScript ES 模块、Apollo Server 5 和 GraphQL.js 16。服务启动时读取五个 JSON 文件，并在内存中建立索引。

## 本地运行

环境要求：Node.js 22.15 或更高版本，以及 npm。

```sh
npm ci
npm start
```

GraphQL 接口地址为 `http://127.0.0.1:4000/`。每次发送 GraphQL 请求时，请带上以下请求头：

```http
Authorization: Bearer backend-test-demo-token
```

`backend-test-demo-token` 仅供本地评审使用。可以通过环境变量 `API_TOKEN`、`HOST` 和 `PORT` 覆盖默认配置。若要监听本机回环地址以外的地址，必须设置自定义令牌。

## 示例查询

在仓库根目录执行：

```sh
curl -sS http://127.0.0.1:4000/ -H "Content-Type: application/json" -H "Authorization: Bearer backend-test-demo-token" --data-binary "@examples/email-node.json"
```

在 Windows PowerShell 中，请用 `curl.exe` 代替 `curl`。如果 PowerShell 阻止执行 `npm.ps1`，可以改用 `npm.cmd`。

示例将变量 `id` 设置为 `6297172e70a0c165b989cd10`，发送以下查询：

```graphql
query EmailNode($id: ID!) {
  node(nodeId: $id) {
    _id
    name
    createdAt
    parentIds
    parents { name }
    trigger { name resourceTemplate { name } }
    responses { name }
    actions { name resourceTemplate { name } }
  }
}
```

查询会返回 **User's Email** 节点及其父节点 **Sign up Webinar**、触发条件 **Email Trigger**、报名回复，以及 **Send Email Action** 的配置。查询不会实际发送邮件。

## Schema 和数据映射

- [`schema.graphql`](src/schema.graphql) 遵循题目给出的 Schema。`node(nodeId: ID)` 接收节点的 `_id`。省略参数、传入 `null` 或使用不存在的 ID 时，返回的 `data.node` 为 `null`。
- 原始数据通过 `compositeId` 引用父节点。`parentIds` 保留这些引用值，`parents` 则用它们查找对应的节点对象。触发条件、回复、动作和资源模板都按各自的 `_id` 查找。
- Schema 只提供一组动作字段，因此 `actionIds` 按 `preActions`、`actions`、`postActions` 的顺序合并引用，同一个 ID 只保留第一次出现的位置。这样可以查到存放在 `postActions` 里的邮件动作。可空列表区分 `null` 和 `[]`；如果列表中有引用找不到对应记录，原位置返回 `null`。
- `Long` 用 JavaScript 安全整数返回 Unix 毫秒时间戳。两条资源模板记录缺少必填的 `createdAt`，服务使用模板 [ObjectId](https://www.mongodb.com/docs/manual/reference/method/objectid/) 中精确到秒的时间作为估计值。已有的时间戳直接返回，原始 JSON 文件保持不变。
- 原始数据的 `localeGroup` 映射为 `localeGroupId`。`JSON` 标量保留回复内容和资源模板的原始 JSON 结构。`functionString` 字段按文本返回。
- 缺少令牌或令牌无效时，返回 HTTP `401`，GraphQL 错误码为 `UNAUTHENTICATED`。

## 代码与测试

[`index.js`](src/index.js) 读取启动配置，[`server.js`](src/server.js) 将 Schema 接入 Apollo，[`auth.js`](src/auth.js) 校验令牌，[`data.js`](src/data.js) 建立索引。[`resolvers.js`](src/resolvers.js) 只为客户端选中的关联字段查找对应记录。

```sh
npm test
```

集成测试会在本地可用端口启动 API，并发送 HTTP 请求，覆盖鉴权、邮件节点的嵌套查询、JSON 数据和时间戳，以及字段缺失的情况。

项目通过 npm 的 `overrides` 使用[已修复的 GraphQL Tools 版本](https://github.com/advisories/GHSA-c4qx-w738-7hr3)。Apollo Server 5.5.2 为兼容 Node.js 20 [限制了该依赖的版本](https://github.com/apollographql/apollo-server/blob/main/packages/server/CHANGELOG.md#552)；本项目要求 Node.js 22.15 或更高版本。
