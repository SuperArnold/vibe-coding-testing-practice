---
description: DashboardPage 測試案例清單
---

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染儀表板基本元素
**範例輸入**：Mock 使用者資料（非 Admin）
**期待輸出**：畫面應顯示「儀表板」標題、會員區塊 (Welcome 訊息與頭像)、登出按鈕、以及「商品列表」標題

---

## [x] 【前端元素】商品載入中狀態 (Loading)
**範例輸入**：Mock `getProducts` API 延遲回應
**期待輸出**：商品區塊應顯示「載入商品中...」與 Loading Spinner

---

## [x] 【前端元素】根據角色顯示管理後台連結：Admin
**範例輸入**：Mock `useAuth` 的 `user.role` 為 "admin"
**期待輸出**：Header 導航列應顯示「🛠️ 管理後台」連結

---

## [x] 【前端元素】根據角色隱藏管理後台連結：非 Admin
**範例輸入**：Mock `useAuth` 的 `user.role` 為 "user"
**期待輸出**：Header 導航列不應顯示「🛠️ 管理後台」連結

---

## [x] 【function 邏輯】點擊登出按鈕
**範例輸入**：點擊「登出」按鈕
**期待輸出**：呼叫 `logout()`，並呼叫 `navigate('/login', { replace: true, state: null })`

---

## [ ] 【Mock API】成功取得商品列表
**範例輸入**：Mock `getProducts` 回傳兩筆測試商品資料
**期待輸出**：Loading 結束後，畫面正確顯示對應數量的商品卡片，包含商品名稱與價格

---

## [ ] 【Mock API】取得商品列表失敗 (非 401)
**範例輸入**：Mock `getProducts` 回傳錯誤 (例如 500)，並帶有 message "系統錯誤"
**期待輸出**：Loading 結束後，商品區塊顯示錯誤圖示與訊息 "系統錯誤"
