---
description: AuthContext 測試案例
---

> 狀態：初始為 [ ]、完成為 [x]
> 注意：狀態只能在測試通過後由流程更新。
> 測試類型：前端元素、function 邏輯、Mock API、驗證權限...

---

## [x] 【Hooks 邏輯】useAuth 必須在 AuthProvider 內使用
**範例輸入**：在沒有包裝 AuthProvider 的元件中呼叫 `useAuth`
**期待輸出**：拋出錯誤 'useAuth must be used within an AuthProvider'

---

## [x] 【Hooks 邏輯】useAuth 在 AuthProvider 內可正常取得 Context 值
**範例輸入**：在 AuthProvider 內的元件中呼叫 `useAuth`
**期待輸出**：正常回傳 `user`、`token`、`login`、`logout` 等初始 Context 屬性

---

## [x] 【初始狀態】未登入時的初始狀態
**範例輸入**：LocalStorage 內無 token，初始化 `AuthProvider`
**期待輸出**：`user` 為 null，`token` 為 null，`isAuthenticated` 為 false，並呼叫 `checkAuth` 將 `isLoading` 設為 false

---

## [x] 【Mock API】login 登入成功
**範例輸入**：呼叫 `login('test@example.com', 'password123')`，Mock `authApi.login` 回傳成功與 accessToken
**期待輸出**：將 token 存入 LocalStorage，`token` 狀態更新，`user` 狀態更新，`isAuthenticated` 變為 true

---

## [x] 【Mock API】login 登入失敗
**範例輸入**：呼叫 `login` 且 Mock API 拋出錯誤
**期待輸出**：向外拋出錯誤，且 LocalStorage 不會儲存 token，狀態不變

---

## [x] 【function 邏輯】logout 登出成功
**範例輸入**：登入狀態下呼叫 `logout()`
**期待輸出**：移除 LocalStorage 的 TOKEN_KEY，清除 `user` 與 `token` 狀態，`isAuthenticated` 變為 false

---

## [x] 【Mock API】checkAuth 驗證有效 Token 成功
**範例輸入**：LocalStorage 內有 token，Mock `authApi.getMe()` 回傳 user 資料
**期待輸出**：`checkAuth` 回傳 true，`user` 更新，`token` 維持，`isLoading` 變為 false

---

## [x] 【Mock API】checkAuth 驗證無效 Token 失敗
**範例輸入**：LocalStorage 內有 token，但 Mock `authApi.getMe()` 拋出 HTTP 回應錯誤
**期待輸出**：呼叫 `logout()` 清除狀態，`checkAuth` 回傳 false，`isLoading` 變為 false

---

## [x] 【Event 監聽】接收到 auth:unauthorized 事件
**範例輸入**：觸發 `window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: '登入已過期' }))`
**期待輸出**：觸發 `logout()` 清除登入狀態，且 `authExpiredMessage` 更新為 '登入已過期'

---

## [x] 【function 邏輯】clearAuthExpiredMessage 清除過期訊息
**範例輸入**：在 `authExpiredMessage` 有值的情況下呼叫 `clearAuthExpiredMessage()`
**期待輸出**：`authExpiredMessage` 被重置為 null
