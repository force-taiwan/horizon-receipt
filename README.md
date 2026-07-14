# 地平線文化事業 | 領據 Form Builder (Horizon Receipt Form Builder)

這是一個專為地平線文化事業打造的**智能領據填寫與管理系統**。支援透過對話輸入或手寫單據圖片上傳，經由 Google Gemini 3.5 / 3.1 AI 多模態模型自動解析填表，並自動完成所得扣繳稅率計算與 A4 單頁列印。

---

## 🌟 核心亮點功能 (Core Features)

1. **對話式/手寫單 AI 自動填表**：
   * 支援自然語言多輪對話增量填表，只針對修改的欄位做回應，保留其餘已填寫欄位。
   * 原生多模態視覺 OCR，上傳手寫單據圖片（如簽章領取便條）即可自動識別並填入對應欄位。
2. **前端自動圖片壓縮優化**：
   * 照片上傳前會自動在瀏覽器端縮放（長邊最大 1280px）並以 JPEG 75% 品質壓縮，降低上傳延遲並省下大筆 Gemini API Token 折耗。
3. **智慧 typos 糾錯與電話預判斷**：
   * 自動依照台灣地址進行地名糾錯（如 `永坑區` 糾正為 `永康區`）。
   * 依門號格式預判斷手機 (09開頭) 與市話，自動填入對應欄位。
4. **雙向稅率與扣繳額聯動計算**：
   * 輸入金額與身分資料後，自動根據國籍、身分證/居留證格式判定所得類別，代入正確稅率計算扣繳稅額與實領金額。
5. **安全金鑰本機儲存**：
   * Gemini API Key 欄位常態顯示，金鑰儲存在本機瀏覽器的 `localStorage` 中，不會隨程式碼洩漏至 GitHub，安全可靠。

---

## 🛠 快速本地啟動 (Local Development)

本專案基於 **Cloudflare Wrangler** 開發，採用單一檔案伺服器架構。

### 1. 安裝 Wrangler (若尚未安裝)
```bash
npm install -g wrangler
```

### 2. 本地啟動開發伺服器
```bash
npx wrangler dev --port 8787
```
開啟瀏覽器前往 `http://localhost:8787` 即可進行開發與測試。

---

## 🚀 部署至 Cloudflare Workers

### 1. 登入 Cloudflare
```bash
npx wrangler login
```

### 2. 發布部署
```bash
npx wrangler deploy
```
系統會自動將靜態資源（`public/`）與 Worker 後端服務編譯並發布部署至 `https://<your-project>.<your-domain>.workers.dev`。

---

## 📄 授權條款 (License)
本專案採用 **SIL Open Font License**（內置字型檔）及 **MIT License** 開源釋出。
