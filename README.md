# os - GitHub Pages 刷題系統

本專案是純靜態（HTML/CSS/Vanilla JS）的刷題練習網站，可直接部署到 GitHub Pages，無需後端與建置流程。

## 頁面

- `index.html`：首頁與學習統計（測驗次數、累計錯題、平均分數）
- `quiz.html`：開始測驗（章節、題型、中文題目過濾、題數、作答、評分、再測一次）
- `review.html`：錯題回顧（篩選、單筆刪除、清空）
- `study.html`：閱讀記憶（篩選、中文題目、答案重複排序、特別記憶高亮）
- `page.html`：最新題庫總覽（各章節題數與題型統計）

## 題庫檔案

預設讀取下列檔案（相對路徑）：

- `CH5.json`
- `CH6.json`
- `CH8.json`
- `CH9.json`

若檔案缺失或讀取失敗，頁面會顯示錯誤訊息並盡可能顯示其他章節資料。

## JSON 題目格式

可使用陣列格式：

```json
[
  {
    "question": "題目文字",
    "options": ["A", "B", "C", "D"],
    "answer": "C",
    "type": "single"
  }
]
```

也支援物件包裹格式：

```json
{
  "questions": [
    {
      "question": "題目文字",
      "answer": "填空答案"
    }
  ]
}
```

### 欄位說明

- `question`：題目文字（必要）
- `options`：選項陣列（可省略，省略時視為填充題）
- `answer`：答案，支援字串、數字、陣列、逗號分隔字串
- `type`：可選，支援 `single` / `multiple` / `text`

若缺少 `type`，會自動推斷：
- 沒有 `options` → `text`
- 多個答案 → `multiple`
- 其他情況 → `single`

## 本地儲存（localStorage）

- `quizStats`：測驗統計
- `wrongQuestions`：錯題紀錄（含章節、題型、作答、正解、時間）
- `quizSettings`：最近一次測驗設定（含再測一次自動開始）

## 部署到 GitHub Pages

1. 將上述檔案推送到 GitHub Repository。
2. 進入 `Settings` → `Pages`。
3. 在 `Build and deployment` 選擇：
   - Source: `Deploy from a branch`
   - Branch: `main`（或你的發佈分支）
   - Folder: `/ (root)`
4. 儲存後等待部署完成，使用提供的 Pages 網址開啟 `index.html`。

## 本地預覽

可直接用瀏覽器開啟 `index.html`。若瀏覽器限制本地 `fetch()`，請用任一靜態伺服器啟動資料夾後預覽。
