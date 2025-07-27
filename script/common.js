/**
 * サイト共通のヘッダーとフッターを読み込み、フッターの言語対応を行うスクリプト
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

    // フッターを読み込んで表示し、言語を調整する
    if (footerPlaceholder) {
        fetch('./_footer.html')
            .then(response => response.ok ? response.text() : Promise.reject('Footer not found'))
            .then(data => {
                footerPlaceholder.innerHTML = data;
                // フッター読み込み後に言語調整関数を呼び出す
                adjustFooterLanguage();
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

/**
 * フッターの言語をページの言語設定に合わせて調整する関数
 */
function adjustFooterLanguage() {
    const translations = {
        ja: { usageNotes: '利用上の注意' },
        en: { usageNotes: 'Usage Notes' }
    };
    
    const lang = document.documentElement.lang || 'ja';
    const usageNotesLink = document.querySelector('[data-key="usageNotes"]');
    
    if (usageNotesLink) {
        // テキストを更新
        if (translations[lang] && translations[lang].usageNotes) {
            usageNotesLink.textContent = translations[lang].usageNotes;
        }
        // リンク先を更新
        usageNotesLink.href = (lang === 'en') ? './copyright_en.html' : './copyright.html';
    }
}