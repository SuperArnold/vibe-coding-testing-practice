import os
import sys
import requests
import json

def main():
    # 1. 讀取從 GitHub Action 傳過來的 git diff 檔案
    try:
        diff_file = sys.argv[1]
        with open(diff_file, 'r', encoding='utf-8') as f:
            diff_content = f.read()
    except IndexError:
        print("錯誤：未提供 diff 檔案路徑")
        sys.exit(1)
    except FileNotFoundError:
        print(f"錯誤：找不到檔案 {diff_file}")
        sys.exit(1)

    # 如果這次 PR 沒有程式碼變更，直接通過 (亮綠燈)
    if not diff_content.strip():
        with open('review.md', 'w', encoding='utf-8') as f:
            f.write("沒有偵測到程式碼變更，無需審查。")
        sys.exit(0) 

    # 2. 準備呼叫 Gemini API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("錯誤：找不到 API Key！請確認 GitHub Secrets 設定是否正確命名為 GEMINI_API_KEY。")
        sys.exit(1) # 亮紅燈

    # 使用目前最新、最快且支援度最高的 2.5 Flash 模型
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    # 3. 設計給 AI 的提示詞 (Prompt)
    prompt = f"""
    你是一位嚴格且專業的資深軟體工程師。請審查以下的 Git Diff 程式碼變更。
    
    【審查重點】
    1. 尋找潛在的 Bug、邏輯錯誤、無窮迴圈或記憶體洩漏。
    2. 尋找安全漏洞 (例如 SQL Injection、XSS、敏感資訊外洩)。
    3. 提供效能優化建議或更好的寫法。
    4. 忽略純粹的排版或縮排問題。

    【回覆格式要求】
    - 請使用繁體中文，並以清晰的 Markdown 格式排版。
    - 如果發現問題，請具體指出在哪個檔案、哪一行，並盡可能給出修改後的程式碼範例 (Code Snippet)。
    - 請確保你的回覆完整，不要話說一半中斷。
    
    【最重要規則：生死判斷】
    為了讓 CI/CD 系統能夠自動判斷是否允許合併程式碼，請你務必在回覆的「最後獨立一行」加上審查結果標籤：
    - 如果你發現了會導致系統崩潰、嚴重安全漏洞等「必須修正」的問題，請在最後一行寫上：[RESULT: REJECT]
    - 如果程式碼寫得很好沒有問題，或者只有微小的建議(不改也不會壞)，請在最後一行寫上：[RESULT: APPROVE]

    Git Diff 內容：
    ```diff
    {diff_content}
    ```
    """

    # 4. 設定 API 請求參數
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,     # 溫度越低，回答越嚴謹、不亂蓋
            "maxOutputTokens": 8192 # 設為最大值，防止 AI 解釋太詳細導致話沒說完被截斷
        }
    }

    # 5. 發送請求並取得結果
    try:
        print("正在呼叫 Gemini API 進行程式碼審查...")
        response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(payload))
        response.raise_for_status() # 檢查 HTTP 狀態碼，如果不是 200 就會拋出例外
        
        response_data = response.json()
        result_text = response_data['candidates'][0]['content']['parts'][0]['text']
        
    except Exception as e:
        error_msg = f"呼叫 Gemini API 失敗: {str(e)}"
        # 如果有詳細的 API 錯誤回應，也一併印出來幫助除錯
        if 'response' in locals() and hasattr(response, 'text'):
            error_msg += f"\n\nAPI 回應內容: {response.text}"
            
        print(error_msg)
        with open('review.md', 'w', encoding='utf-8') as f:
            f.write(error_msg)
        sys.exit(1) # 讓 GitHub Action 亮紅燈

    # 6. 將 AI 的完整回覆寫入 Markdown 檔案 (供 GitHub Action 留言使用)
    with open('review.md', 'w', encoding='utf-8') as f:
        f.write(result_text)

    # 7. 判斷生死：嚴謹的防呆機制 (Fail-Safe)
    if "[RESULT: REJECT]" in result_text:
        print("AI 判定程式碼有嚴重問題，阻擋 Merge。")
        sys.exit(1) # 回傳 1，終止程式並讓 GitHub Action 亮紅燈
        
    elif "[RESULT: APPROVE]" in result_text:
        print("AI 審核通過，允許 Merge！")
        sys.exit(0) # 回傳 0，終止程式並讓 GitHub Action 亮綠燈
        
    else:
        # 預設阻擋機制：如果 AI 因為任何原因沒有輸出標準結果 (例如網路截斷、AI 突然失常)
        # 基於安全考量，我們一律預設為「不准過」，這就是工程上的 Fail-Safe
        print("警告：AI 回覆不完整或未給出明確結論，預設阻擋 Merge。")
        
        # 把警告資訊追加寫入到 PR 留言的最下方
        with open('review.md', 'a', encoding='utf-8') as f:
            f.write("\n\n---\n**⚠️ 系統警告：AI 審查未正常完成（未偵測到放行/拒絕標籤），基於安全考量預設阻擋合併。請重新觸發 Action 或由人工介入檢查。**")
            
        sys.exit(1) # 讓 GitHub Action 亮紅燈

if __name__ == "__main__":
    main()