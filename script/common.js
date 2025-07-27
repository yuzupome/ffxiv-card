/**
 * サイト共通のヘッダーとフッターを読み込むスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // ヘッダーを読み込んで表示
<header class="site-header">
    <img src="./assets/favicon.png" alt="Logo" class="header-logo">
    <h1 class="header-title">FFXIV Character Card Generator</h1>
</header>

    // フッターを読み込んで表示
    if (footerPlaceholder) {
        fetch('./_footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Footer not found');
                }
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
});