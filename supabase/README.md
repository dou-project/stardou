# 登录与排行榜

账号、头像和成绩存在 [Supabase](https://supabase.com)。站点仍然是纯静态页面，浏览器直接调用 Supabase。没有配置时，登录和排行榜的入口全部隐藏，游戏照常可玩。

## 规则

- 进入任何一个游戏页面前都要先登录，还没有头像的账号要先上传头像。首页和排行榜不登录也能看。
- 注册需要邮箱、密码、昵称和一张头像。头像在浏览器里居中裁成正方形，缩到 256px 后再上传，每张只有十几 KB。
- 登录后，这个浏览器里所有模式（包括无限模式）玩完的题都会自动上传。每题只上传一次，之后不能修改。
- 用完次数还没认输，也算这题结束。
- **换设备：** 做完的题连同猜过的词一起存一份到 `progress` 表，只有本人能读（猜过的词里有答案）。在别的设备登录后，游戏页面打开前会先把这些记录取回浏览器，所以在电脑上做完的题，手机上也显示已完成。已经在这台设备上做完的题保持不变。
- **今日榜**：成语、五言、七言各一张，比当天的每日一题。通关的人按猜的次数从少到多排，次数相同比用了几个提示，再相同比用时。认输或超过次数上限的排在最后，不给名次。
- **总榜**：可以看全部模式，也可以只看单个模式。按通关题数从多到少排，题数相同比平均猜测次数。通关指在次数上限内猜中，成语 10 次，诗句 15 次。

## 上线

1. 在 supabase.com 新建项目。
2. 建表：在 SQL Editor 里按顺序执行 [migrations/](./migrations/) 里的文件。也可以用 CLI：`npx supabase link --project-ref <ref> && npx supabase db push`。这一步会同时建好头像用的 `avatars` 存储桶。
3. Authentication → URL Configuration：Site URL 填 `https://dou-project.github.io/stardou/`，Redirect URLs 加上 `https://dou-project.github.io/stardou/**`。
4. Authentication → Providers → Email：
   - 想让玩家注册完直接玩：关掉 **Confirm email**。
   - 想保留邮件确认：Supabase 自带的发信服务每小时只能发几封，正式使用要在 Authentication → SMTP 里配置自己的发信服务。头像会先存在玩家的浏览器里，等他第一次登录时再上传。
5. GitHub 仓库 → Settings → Secrets and variables → Actions → **Variables**，添加：
   - `SUPABASE_URL`：Project Settings → API 页面里的 Project URL
   - `SUPABASE_ANON_KEY`：同一页面的 anon / publishable key

   anon key 本来就是公开给浏览器用的，数据安全靠表上的行级安全（RLS）保证，所以放在 Variables 里就行。**不要**放 service_role key。
6. 推送到 `main`。部署完成后，首页和游戏页右上角会出现奖杯图标。

## 本地开发

需要 Docker。

```bash
npx supabase start          # 本地启动 Postgres、Auth 和 Storage，并自动执行 migrations/
npx supabase status -o env  # 查看 API_URL 和 ANON_KEY
printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' <API_URL> <ANON_KEY> > .env.local
pnpm dev
npx supabase stop --no-backup   # 用完后连同本地数据一起删掉
```

## 已知限制

- **作弊拦不住。** 题库打包在网页代码里，懂行的人能直接查到当天答案；成绩也是浏览器上报的。数据库只保证每人只能写自己的成绩、数值在合理范围内、写入后不能修改。要真正防作弊，得把答案和判分挪到服务器上，工作量大很多。
- **头像没有审核。** 谁都可以上传任何图片。如果遇到不当头像，可以在 Supabase 后台的 Storage → avatars 里删除，再把这个人在 `profiles` 表里的 `avatar_v` 清空。
- **每张榜只显示前 100 名。** 总榜视图每次请求都会重新汇总整张成绩表，几万条记录以内没问题。数据再多，可以改成定时刷新的物化视图。
