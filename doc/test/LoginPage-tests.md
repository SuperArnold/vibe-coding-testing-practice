---
description: LoginPage 測試案例清單
---

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【前端元素】渲染登入頁面基本元素
**範例輸入**：無（單純渲染組件）
**期待輸出**：畫面應顯示「歡迎回來」標題、Email 欄位、密碼欄位、以及「登入」按鈕

---

## [x] 【function 邏輯】Email 格式驗證：為空字串
**範例輸入**：Email 輸入空字串，點擊登入
**期待輸出**：Email 欄位下方顯示錯誤訊息「請輸入有效的 Email 格式」，且不呼叫 `login` API

---

## [x] 【function 邏輯】Email 格式驗證：無效格式
**範例輸入**：Email 輸入 "invalid-email"，點擊登入
**期待輸出**：Email 欄位下方顯示錯誤訊息「請輸入有效的 Email 格式」，且不呼叫 `login` API

---

## [x] 【function 邏輯】密碼格式驗證：長度不足 8 碼
**範例輸入**：Email 輸入 "test@example.com"，密碼輸入 "1234567"，點擊登入
**期待輸出**：密碼欄位下方顯示錯誤訊息「密碼必須至少 8 個字元」，且不呼叫 `login` API

---

## [x] 【function 邏輯】密碼格式驗證：未包含英文字母和數字
**範例輸入**：Email 輸入 "test@example.com"，密碼輸入 "abcdefgh" 或 "12345678"，點擊登入
**期待輸出**：密碼欄位下方顯示錯誤訊息「密碼必須包含英文字母和數字」，且不呼叫 `login` API

---

## [x] 【Mock API】登入成功：導向 dashboard
**範例輸入**：輸入符合格式的 Email 與密碼，點擊登入，並 Mock `login` API 回傳成功
**期待輸出**：登入按鈕顯示「登入中...」，API 回傳成功後，呼叫 `navigate('/dashboard', { replace: true })`

---

## [x] 【Mock API】登入失敗：顯示錯誤訊息
**範例輸入**：輸入符合格式的 Email 與密碼，點擊登入，並 Mock `login` API 回傳錯誤（例如 message 為 "密碼錯誤"）
**期待輸出**：畫面上方顯示錯誤 Banner，內容為 "密碼錯誤"

---

## [ ] 【驗證權限】已登入狀態：自動導向 dashboard
**範例輸入**：使用 Mock 讓 `isAuthenticated` 為 `true`
**期待輸出**：畫面不應停留在登入頁，應立刻呼叫 `navigate('/dashboard', { replace: true })`

---

## [ ] 【驗證權限】登入過期：顯示過期訊息
**範例輸入**：使用 Mock 讓 `authExpiredMessage` 為 "登入已過期，請重新登入"
**期待輸出**：畫面上方顯示錯誤 Banner，內容為 "登入已過期，請重新登入"，並呼叫 `clearAuthExpiredMessage` 清除狀態
