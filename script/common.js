/**
 * サイト共通のヘッダーとフッターを読み込み、多言語対応を行うスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // ヘッダーを読み込んで表示
    if (headerPlaceholder) {
        fetch('./_header.html')
            .then(response => response.ok ? response.text() : Promise.reject('Header not found'))
            .then(data => {
                headerPlaceholder.innerHTML = data;
            })
            .catch(error => console.error('Error loading header:', error));
    }

    // フッターを読み込んで表示し、その後で言語対応処理を実行
    if (footerPlaceholder) {
        fetch('./_footer.html')
            .then(response => response.ok ? response.text() : Promise.reject('Footer not found'))
            .then(data => {
                footerPlaceholder.innerHTML = data;
                adjustFooterForLanguage(); // フッター読み込み後に言語調整を実行
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

/**
 * ページの言語設定を読み取り、フッターのテキストとリンクを調整する関数
 */
function adjustFooterForLanguage() {
    // 現在のページの言語を取得 (ja または en)
    const lang = document.documentElement.lang || 'ja';
    
    // フッター内の「利用上の注意」のリンク要素を探す
    const usageNotesLink = document.querySelector('[data-key="usageNotes"]');

    if (usageNotesLink) {
        if (lang === 'en') {
            // 英語ページの場合、テキストとリンク先を英語用に変更
            usageNotesLink.textContent = 'Usage Notes';
            usageNotesLink.href = './copyright_en.html';
        } else {
            // 日本語ページの場合（デフォルト）
            usageNotesLink.textContent = '利用上の注意';
            usageNotesLink.href = './copyright.html';
        }
    }
}