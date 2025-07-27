/**
 * サイト共通のヘッダーとフッターを読み込むスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // ヘッダーを読み込んで表示
    if (headerPlaceholder) {
        fetch('./_header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Header not found');
                }
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading header:', error);
            });
    }

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