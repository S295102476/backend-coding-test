# 测试说明

提交人：张嘉浩  
运行环境：Node.js 22.15.0 或更高版本（含 npm）。

在仓库根目录安装依赖并启动服务：

```sh
npm ci
npm start
```

保持服务运行，另开一个终端，在仓库根目录发送示例请求：

```sh
curl -sS http://127.0.0.1:4000/ -H "Content-Type: application/json" -H "Authorization: Bearer backend-test-demo-token" --data-binary "@examples/email-node.json"
```

请求成功时，响应中的 `data.node.name` 为 `User's Email`。缺少或使用错误的测试 token 时，接口返回 HTTP 401。

运行自动化测试：

```sh
npm test
```

在 Windows PowerShell 中，用 `curl.exe` 代替 `curl`。如果运行 `npm` 时遇到脚本执行限制，可以用 `npm.cmd`。
