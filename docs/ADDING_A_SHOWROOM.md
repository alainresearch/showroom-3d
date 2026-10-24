# 添加样板间

每个房型独立存放在 `showrooms/<slug>/`；共享界面与漫游逻辑放在 `web/`。`slug` 使用小写字母、数字与连字符，例如 `tianlan-385a-01`。

1. 建立案例目录，新增 `metadata.json` 与 `model.js`。可以复制已有案例的文件结构，再替换空间与证据内容。
2. 在元数据中填入标题、户型标识、位置、来源链接和未确认事项。`id` 必须与目录名一致；不要写入本地路径或私人信息。
3. 先按图纸尺寸搭建外轮廓、房间、门窗和碰撞边界，再加入家具与材料。每项无法核实的尺度或布置都应记录为假设。
4. 执行 `npm run build`、`npm test` 和 `npm run serve`，检查房间连接、入口、行走碰撞、相机高度及案例切换。
5. 提交公开源文件及 `sources.md`；发布 `dist/`。提交前检查是否夹带原始照片、私人资料或未获许可的素材。

## 元数据

必填字符串字段：`id`、`title`、`subtitle`、`areaLabel`、`layoutLabel`、`location`、`description`、`sourceSummary`。

- `assumptions`：字符串数组，记录净高、墙厚、家具等暂定事项。
- `sources`：`{ "label": "来源名称", "url": "https://..." }` 数组，仅使用公开 HTTP(S) 链接。
- `startRoom`：可选的初始房间标识，应与模型中的房间约定一致。

构建时会生成 `dist/showrooms.json`，其内容为元数据对象数组；界面按 `id` 加载对应 `showrooms/<id>/model.js`。

## 模型接口

`model.js` 提供命名导出 `createApartment()`，返回以下对象：

```js
export function createApartment() {
  return { group, ceilings, furniture, colliders, rooms, bounds, entry, metrics };
}
```

`group` 是空间的 Three.js 根组；其余成员分别提供顶面、家具、碰撞体、房间、整体边界、入口和尺度信息。具体成员的数据结构、单位和坐标约定以当前共享应用及首案例实现为准，新增案例应保持相同接口。不要在模型内另行创建渲染器或绑定全局键盘事件。

## 后续资源

目前构建仅复制每个案例的 `model.js` 与 `metadata.json`。新增纹理、GLB 等资源时，先确认可公开分发的权利，再扩展构建脚本的明确文件清单或公开资产目录，并同步更新加载路径与测试。不要把整个参考目录直接复制到发布包。

私人参考可放在案例的 `references/private/`，但 `.gitignore` 只是防误提交措施，不能替代提交前检查。公开证据说明放在 `sources.md`，注明来源日期、图号、尺寸关系、推定方式和素材权利。
