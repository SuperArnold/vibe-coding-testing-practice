import os
import sys
import requests
import json

def main():
    # 1. 讀取從 GitHub Action 傳過來的 git diff 檔案
    diff_file = sys.argv[1]
    with open(diff_file, 'r', encoding='utf-8') as f:
        diff_content = f.read()

    # 如果這次 PR 沒有程式碼變更 (例如只改了圖片)，就直接下班
    if not diff_content.strip():
        with open('review.md', 'w', encoding='utf-8') as f:
            f.write("沒有偵測到程式碼變更，無需審查。")
        sys.exit(0) # 0 代表成功 (亮綠燈)

    # 2. 準備呼叫 Gemini API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("找不到 API Key！請確認 GitHub Secrets 設定。")
        sys.exit(1) # 1 代表失敗 (亮紅燈)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    # 3. 設計給 AI 的提示詞 (Prompt) - 這是 AI 審查的標準
    prompt = f"""
    你是一位嚴格的資深軟體工程師。請審查以下的 Git Diff 程式碼變更。
    
    【審查重點】
    1. 尋找潛在的 Bug、邏輯錯誤或記憶體洩漏。
    2. 尋找安全漏洞 (例如 SQL Injection、XSS)。
    3. 效能優化建議。
    4. 忽略純粹的排版或縮排問題。

    【回覆格式】
    - 請使用繁體中文，並以 Markdown 格式排版。
    - 如果發現問題，請具體指出在哪一行，並給出修改建議 (提供 Code Snippet)。
    
    【最重要規則】
    - 如果你發現了會導致系統崩潰、嚴重漏洞等「必須修正」的問題，請在回覆的最後獨立一行寫上：[RESULT: REJECT]
    - 如果程式碼寫得很好，或者只有微小的建議(不改也不會壞)，請在回覆的最後獨立一行寫上：[RESULT: APPROVE]

    Git Diff 內容：
    ```diff
    {diff_content}
    ```
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2, # 溫度越低，回答越嚴謹、不亂蓋
            "maxOutputTokens": 2048
        }
    }

    # 4. 發送請求並取得結果
    try:
        response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(payload))
        response.raise_for_status() # 如果 API 發生錯誤 (如 400, 500) 會拋出異常
        
        response_data = response.json()
        result_text = response_data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        error_msg = f"呼叫 Gemini API 失敗: {str(e)}"
        print(error_msg)
        with open('review.md', 'w', encoding='utf-8') as f:
            f.write(error_msg)
        sys.exit(1)

    # 5. 把 AI 的完整回覆寫入 Markdown 檔案，等等 GitHub Action 會把這個檔案留言到 PR 上
    with open('review.md', 'w', encoding='utf-8') as f:
        f.write(result_text)

    # 6. 判斷生死：尋找我們規定 AI 輸出的關鍵字
    if "[RESULT: REJECT]" in result_text:
        print("AI 判定程式碼有嚴重問題，阻擋 Merge。")
        sys.exit(1) # 終止程式並回報錯誤給 GitHub
    else:
        print("AI 審核通過！")
        sys.exit(0) # 終止程式並回報成功給 GitHub

if __name__ == "__main__":
    main()