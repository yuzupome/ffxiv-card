/**
 * サイト共通のヘッダーとフッターを読み込み、フッターの機能を追加するスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    if (headerPlaceholder) {
        fetch('./_header.html')
            .then(response => response.ok ? response.text() : Promise.reject('Header not found'))
            .then(data => { 
                headerPlaceholder.innerHTML = data;
                setupMobileMenu(); // ★追加: ヘッダー読み込み完了後にメニュー機能を初期化
            })
            .catch(error => console.error('Error loading header:', error));
    }

    if (footerPlaceholder) {
        fetch('./_footer.html')
            .then(response => response.ok ? response.text() : Promise.reject('Footer not found'))
            .then(data => {
                footerPlaceholder.innerHTML = data;
                adjustFooterLanguage();
                initializeFooterFunctions(); // ← フッター機能の初期化
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

/**
 * ★追加: ハンバーガーメニューの開閉ロジック
 */
function setupMobileMenu() {
    const toggleBtn = document.getElementById('menuToggle');
    const body = document.body;

    // ボタンが存在しない場合は何もしない（エラー防止）
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('menu-open');
        
        // メニューが開いているときはスクロールを禁止する（UX向上）
        if (body.classList.contains('menu-open')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    });

    // リンクをクリックしたらメニューを閉じる
    const navLinks = document.querySelectorAll('.global-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('menu-open');
            body.style.overflow = '';
        });
    });
}