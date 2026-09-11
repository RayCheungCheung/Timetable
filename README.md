# 📅 我的課表 App (Timetable)

一個專為中學生設計的課表應用程式，支援多種實用功能。

![Version](https://img.shields.io/badge/version-1.01-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 功能總覽

### 核心功能
- 📅 **明日課表預測**：自動顯示明天的課表
- ⏱️ **上/下課倒數**：即時倒數距離上課或下課還有多久
- 📊 **本週課表總覽**：用表格顯示整週課表
- 🎉 **下一個假期倒數**：顯示距離下個假期還有幾天

### 進階功能
- 🔍 **智能搜尋**：支援科目、老師、日期搜尋
- 🌙 **深色 / 淺色模式**：跟隨系統或手動切換
- 📖 **卡片展開**：點擊課表卡片查看詳細資訊
- ⏰ **刷臉倒計時**：午休期間顯示刷臉倒數

### 響應式設計
- 📱 **手機**：全螢幕滿版顯示
- 💻 **電腦**：模擬 iPhone 外框顯示

---

## 🚀 快速開始

### 1. 複製專案
```bash
git clone https://github.com/RayCheungCheung/Timetable.git
cd Timetable
```

### 2. 啟動本機伺服器
```bash
# 使用 Python
python -m http.server 8000

# 或使用 VS Code Live Server
# 右鍵點擊 index.html → Open with Live Server
```

### 3. 打開瀏覽器
前往 `http://localhost:8000`

---

## 🌐 線上版本

你可以在這裡查看線上版本：

👉 **[https://raycheungcheung.github.io/Timetable/](https://raycheungcheung.github.io/Timetable/)**

---

## 📁 專案結構

```
Timetable/
├── index.html                    # 主頁面
├── README.md                     # 專案說明
├── CHANGELOG.md                  # 更新日誌
├── manifest.json                 # PWA 設定檔
├── service-worker.js             # PWA 離線快取
│
├── data/                         # 資料層
│   ├── schedule.json             # 課表資料
│   └── holidays.json             # 假期資料
│
├── styles/                       # 樣式層
│   ├── main.css                  # 主樣式
│   ├── themes/                   # 主題
│   │   ├── dark.css
│   │   └── light.css
│   ├── components/               # 元件
│   │   ├── cards.css
│   │   ├── buttons.css
│   │   └── animations.css
│   └── pages/                    # 頁面
│       ├── menu.css
│       ├── schedule.css
│       └── realtime.css
│
└── scripts/                      # 邏輯層
    ├── main.js                   # 主程式
    ├── utils/                    # 工具
    │   ├── time.js
    │   └── storage.js
    └── modules/                  # 功能模組
        ├── search/               # 搜尋
        ├── theme/                # 主題切換
        ├── weekly/               # 本週總覽
        ├── holidays/             # 假期倒數
        ├── animations/           # 動畫效果
        └── expand/               # 卡片展開
```

---

## 🛠️ 技術棧

- **HTML5**：語義化標籤
- **CSS3**：Flexbox、Grid、CSS 變數、動畫
- **JavaScript (ES6+)**：Fetch API、LocalStorage、Date API
- **無框架**：純原生，輕量快速

---

## ✨ 功能截圖

### 首頁選單
- 搜尋欄（支援科目、老師、日期）
- 四個主要功能按鈕
- 右上角主題切換按鈕

### 明日課表
- 顯示明天的所有課堂
- 卡片包含節次、科目、老師、時間

### 上/下課倒數
- 即時時間顯示
- NOW 卡片（當前狀態）
- Coming Up 卡片（下一個事件）
- 午休刷臉倒計時

### 本週課表總覽
- 7 欄（週一至週六）
- 7 行（第 1 至第 7 節）
- 顯示每堂課的科目與老師

### 下一個假期倒數
- 顯示距離下個假期還有幾天
- 假期卡片包含名稱、日期、備註

---

## 📝 更新日誌

請參考 [CHANGELOG.md](CHANGELOG.md)

### Version 1.01 (2026-09-11)
- ✨ 新增日期搜尋功能
- ✨ 新增午休刷臉倒計時
- 🎨 主題切換按鈕重新設計（移到右上角）
- 🔧 修正防閃爍更新
- 🔧 修正 Coming Up 邏輯
- 🔧 修正星期六課表
- 🔧 修正科目名稱

### Version 1.00 (2026-09-10)
- ✨ 首次發布
- 📅 明日課表預測
- ⏱️ 即時倒數
- 📊 本週課表總覽
- 🎉 下一個假期倒數
- 🌙 深色 / 淺色模式
- 🔍 搜尋功能

---

## 🎯 未來計劃

### Version 1.02（計劃中）
- 🔐 登入模式（輸入姓名與班級）
- 📝 考試倒數
- 🔔 考試提醒
- 🏫 多班級選擇

### Version 1.1.0（計劃中）
- 📚 作業管理系統
- 📊 成績記錄與趨勢圖
- 🍅 番茄鐘專注模式
- 📱 PWA 支援

### Version 2.0.0（未來）
- ☁️ 雲端同步（Firebase）
- 👥 多用戶支援
- 📈 學習數據分析

---

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

### 如何貢獻
1. Fork 此專案
2. 建立你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit 你的變更 (`git commit -m 'Add some AmazingFeature'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權條款。詳情請參考 [LICENSE](LICENSE) 檔案。

---

## 👨‍💻 作者

**Ray Cheung**
- GitHub: [@RayCheungCheung](https://github.com/RayCheungCheung)

---

## 🙏 致謝

感謝所有提供建議與測試的同學！

---

## 📞 聯絡方式

如果你有任何問題或建議，歡迎：
- 提交 [Issue](https://github.com/RayCheungCheung/Timetable/issues)
- 或直接聯絡作者

---

⭐ 如果這個專案對你有幫助，歡迎給個 Star！
```

