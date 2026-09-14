$content = Get-Content -Raw C:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\FarmerDashboard.tsx
$content = $content -replace '(?s)<div className="max-w-7xl mx-auto">\s*\{status !== ''Approved''.*?</div>\s*\}\)\}\s*<header className="mb-8', '<header className="mb-8'
Set-Content -Path C:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\FarmerDashboard.tsx -Value $content
