# GitHub 上傳與部署腳本
Write-Host "🚀 開始建置與上傳程序..." -ForegroundColor Cyan

# 1. 執行題目處理 (確保資料是最新的)
Write-Host "📦 正在處理題庫資料..." -ForegroundColor Yellow
node process-questions.cjs

# 2. 執行專案建置
Write-Host "🏗️ 正在進行專案建置 (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 建置失敗，請檢查程式碼錯誤。" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3. Git 提交
Write-Host "Git 提交中..." -ForegroundColor Yellow
git add .
git commit -m "Update: 更新題庫解析與 UI/UX 緊湊化優化"

# 4. 推送到 GitHub 原始碼倉庫
Write-Host "📤 正在推送原始碼到 GitHub (main)..." -ForegroundColor Yellow
git push origin main

# 5. 部署到 GitHub Pages
Write-Host "🚀 正在部署到 GitHub Pages (npm run deploy)..." -ForegroundColor Yellow
npm run deploy

Write-Host "✅ 所有程序已完成！您的網站應在幾分鐘後更新。" -ForegroundColor Green
pause
