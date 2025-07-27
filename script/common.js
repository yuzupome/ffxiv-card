/**
 * サイト共通のヘッダーとフッターを読み込み、フッターの機能を追加するスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    if (headerPlaceholder) {
        fetch('./_header.html')
            .then(response => response.ok ? response.text() : Promise.reject('Header not found'))
            .then(data => { headerPlaceholder.innerHTML = data; })
            .catch(error => console.error('Error loading header:', error));
    }

    if (footerPlaceholder) {
        fetch('./_footer.html')
            .then(response => response.ok ? response.text() : Promise.reject('Footer not found'))
            .then(data => {
                footerPlaceholder.innerHTML = data;
                adjustFooterLanguage();
                initializeFooterFunctions(); // ← フッター機能の初期化を追加
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

function adjustFooterLanguage() {
    const translations = {
        ja: { usageNotes: 'About us' },
        en: { usageNotes: 'About us' } 
    };
    
    const lang = document.documentElement.lang || 'ja';
    const usageNotesLink = document.querySelector('[data-key="usageNotes"]');
    
    if (usageNotesLink) {
        if (translations[lang] && translations[lang].usageNotes) {
            usageNotesLink.textContent = translations[lang].usageNotes;
        }
        usageNotesLink.href = (lang === 'en') ? './copyright_en.html' : './copyright.html';
    }
}

/**
 * フッター内のインタラクティブな要素を初期化する関数
 */
function initializeFooterFunctions() {
    const toTopLink = document.getElementById('footerToTopLink');
    if (toTopLink) {
        toTopLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}