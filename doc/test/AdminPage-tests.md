---
description: AdminPage 測試案例清單
---

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染管理後台基本元素
**範例輸入**：無（單純渲染組件）
**期待輸出**：畫面應顯示「🛠️ 管理後台」標題、「← 返回」連結、登出按鈕，以及「管理員專屬頁面」區塊

---

## [x] 【前端元素】根據角色顯示 Badge：Admin
**範例輸入**：Mock `useAuth` 的 `user.role` 為 "admin"
**期待輸出**：Header 右上的 role-badge 應顯示「管理員」，且具有 `admin` class

---

## [x] 【前端元素】根據角色顯示 Badge：User
**範例輸入**：Mock `useAuth` 的 `user.role` 為 "user"
**期待輸出**：Header 右上的 role-badge 應顯示「一般用戶」，且具有 `user` class

---

## [ ] 【function 邏輯】點擊返回連結導向 Dashboard
**範例輸入**：點擊「← 返回」連結
**期待輸出**：路由導向至 `/dashboard`

---

## [ ] 【function 邏輯】點擊登出按鈕
**範例輸入**：點擊「登出」按鈕
**期待輸出**：呼叫 `logout()`，並呼叫 `navigate('/login', { replace: true, state: null })`
