<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FFXIV Character Card Generator</title>
  <link rel="icon" type="image/png" href="./assets/favicon.png">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Orbitron:wght@600&family=DotGothic16&family=Exo+2&family=Share+Tech&family=Permanent+Marker&family=Hachi+Maru+Pop&family=Dancing+Script&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="./assets/css/style.css" />
</head>
<body>

  <div id="loader">
    <img src="./assets/favicon.png" alt="loading..." class="spinner-icon">
    <p class="loading-text">Now Loading...</p>
    <div class="progress-bar-container">
        <div id="progressBar"></div>
    </div>
    <p id="progressText" class="loading-text">0%</p>
  </div>

  <div id="app" class="hidden">
    <header class="site-header">
        <img src="./assets/favicon.png" alt="logo" class="header-logo">
        <h1 class="header-title">FFXIV Character Card Generator</h1>
    </header>

    <div class="content-wrapper">
        <main class="preview-panel">
            <div class="canvas-container">
                <div class="canvas-wrapper">
                    <canvas id="background-layer"></canvas>
                    <canvas id="character-layer"></canvas>
                    <canvas id="ui-layer"></canvas>
                    
                    <div id="mini-loader" class="mini-loader hidden">
                        <img src="./assets/favicon.png" alt="loading..." class="spinner-icon">
                        <p id="mini-progress-text" class="loading-text">0%</p>
                    </div>
                </div>
            </div>
        </main>

        <aside class="controls-panel">
            <div id="controls">
                <div class="control-section">
                    <h2 class="section-title">Card Templates</h2>
                    <select id="templateSelect">
                        <option value="Gothic_black">🖤 Gothic Black</option>
                        <option value="Gothic_white">🤍 Gothic White</option>
                        <option value="Gothic_pink">🩷 Gothic Pink</option>
                        <option value="Neon_mono">🎩 Neon Mono</option>
                        <option value="Neon_duotonek">🍋 Neon Lime</option>
                        <option value="Neon_meltdown">🦄 Neon Melt</option>
                        <option value="Water">🫧 Aqua Flow</option>
                        <option value="Lovely_heart">💋 Lovely Heart</option>
                        <option value="Royal_garnet">🥀 Royal Garnet</option>
                        <option value="Royal_sapphire">💎 Royal Sapphire</option>
                    </select>
                </div>

                <div id="top-controls">
                    <label for="uploadImage" class="file-upload-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        <span>画像をアップロード</span>
                    </label>
                    <input type="file" id="uploadImage" accept="image/*" class="file-upload-input">
                    <p id="fileName" class="file-name-display"></p>
                    
                    <div class="usage-notes">
                        <p class="notes-text">⚠️ 著作権表記は画像出力時に自動で付与されます</p>
                    </div>
                </div>

                <div class="control-section">
                    <h2 class="section-title">Profile</h2>
                    <div class="grid-col-2">
                        <input type="text" id="nameInput" placeholder="表示したいキャラ名を入力" />
                        <select id="fontSelect" required>
                            <option value="" disabled selected>キャラ名のフォントを選ぶ</option>
                            <option value="'Orbitron', sans-serif">Orbitron</option>
                            <option value="'Exo 2', sans-serif">Exo 2</option>
                            <option value="'Share Tech', sans-serif">Share Tech</option>
                            <option value="'Permanent Marker', cursive">Permanent Marker</option>
                            <option value="'Hachi Maru Pop', cursive">はちまるポップ</option>
                            <option value="'DotGothic16', sans-serif">ドットゴシック16</option>
                            <option value="'Dancing Script', cursive">Dancing Script</option>
                        </select>
                    </div>
                    <div class="grid-col-3" style="margin-top: 1rem;">
                        <select id="dcSelect" required>
                            <option value="" disabled selected>DC</option>
                            <option value="mana">Mana</option> <option value="gaia">Gaia</option> <option value="elemental">Elemental</option> <option value="meteor">Meteor</option>
                        </select>
                        <select id="raceSelect" required>
                            <option value="" disabled selected>種族</option>
                            <option value="au_ra">アウラ</option>
                            <option value="hrothgar">ロスガル</option>
                            <option value="viera">ヴィエラ</option>
                            <option value="elezen">エレゼン</option>
                            <option value="miqote">ミコッテ</option>
                            <option value="hyur">ヒューラン</option>
                            <option value="roegadyn">ルガディン</option>
                            <option value="lalafell">ララフェル</option>
                        </select>
                        <select id="progressSelect" required>
                            <option value="" disabled selected>進行度</option>
                            <option value="shinsei">新生</option> <option value="souten">蒼天</option> <option value="guren">紅蓮</option> <option value="shikkoku">漆黒</option> <option value="gyougetsu">暁月</option> <option value="ougon">黄金</option> <option value="all_clear">ALL CLEAR</option>
                        </select>
                    </div>
                </div>

                <div class="control-section">
                    <h2 class="section-title">Play Style</h2>
                    <div id="styleButtons" class="button-grid">
                        <button data-value="leveling">レベリング</button>
                        <button data-value="raid">レイド</button>
                        <button data-value="pvp">PvP</button>
                        <button data-value="dd">DD</button>
                        <button data-value="hunt">モブハン</button>
                        <button data-value="map">地図</button>
                        <button data-value="gatherer">ギャザラー</button>
                        <button data-value="crafter">クラフター</button>
                        <button data-value="gil">金策</button>
                        <button data-value="perform">演奏</button>
                        <button data-value="streaming">配信</button>
                        <button data-value="glam">ミラプリ</button>
                        <button data-value="studio">スタジオ制作</button>
                        <button data-value="housing">ハウジング</button>
                        <button data-value="screenshot">SS撮影</button>
                        <button data-value="drawing">お絵描き</button>
                        <button data-value="roleplay">ロールプレイ</button>
                    </div>
                </div>

                <div class="control-section">
                    <h2 class="section-title">Play Time</h2>
                    <div id="playtimeOptions" class="checkbox-group">
                        <div class="time-section">
                            <span>平日</span>
                            <div class="options-row">
                                <label><input type="checkbox" class="weekday" value="morning" /><span></span>朝</label> <label><input type="checkbox" class="weekday" value="daytime" /><span></span>昼</label> <label><input type="checkbox" class="weekday" value="night" /><span></span>夜</label> <label><input type="checkbox" class="weekday" value="midnight" /><span></span>深夜</label>
                            </div>
                        </div>
                        <div class="time-section">
                            <span>休日</span>
                            <div class="options-row">
                                <label><input type="checkbox" class="holiday" value="morning" /><span></span>朝</label> <label><input type="checkbox" class="holiday" value="daytime" /><span></span>昼</label> <label><input type="checkbox" class="holiday" value="night" /><span></span>夜</label> <label><input type="checkbox" class="holiday" value="midnight" /><span></span>深夜</label>
                            </div>
                        </div>
                        <div class="time-section">
                            <span>その他</span>
                            <div class="options-row">
                                <label><input type="checkbox" class="other" value="random" /><span></span>不定期</label> <label><input type="checkbox" class="other" value="fulltime" /><span></span>エオ在住</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="control-section">
                    <h2 class="section-title">Difficulty</h2>
                    <div id="difficultyOptions" class="checkbox-group-single">
                        <label><input type="checkbox" class="difficulty" value="extreme" /><span></span>極</label> <label><input type="checkbox" class="difficulty" value="unreal" /><span></span>幻</label> <label><input type="checkbox" class="difficulty" value="savage" /><span></span>零式</label> <label><input type="checkbox" class="difficulty" value="ultimate" /><span></span>絶</label>
                    </div>
                </div>
            
                <div class="control-section">
                    <h2 class="section-title">Main Job</h2>
                    <select id="mainjobSelect" required>
                        <option value="" disabled selected>メインジョブを選ぶ</option>
                        <option value="paladin">ナイト</option> <option value="warrior">戦士</option> <option value="darkknight">暗黒騎士</option> <option value="gunbreaker">ガンブレイカー</option> <option value="whitemage">白魔導士</option> <option value="scholar">学者</option> <option value="astrologian">占星術師</option> <option value="sage">賢者</option> <option value="monk">モンク</option> <option value="dragoon">竜騎士</option> <option value="ninja">忍者</option> <option value="samurai">侍</option> <option value="reaper">リーパー</option> <option value="viper">ヴァイパー</option> <option value="bard">吟遊詩人</option> <option value="machinist">機工士</option> <option value="dancer">踊り子</option> <option value="blackmage">黒魔導士</option> <option value="summoner">召喚士</option> <option value="redmage">赤魔導士</option> <option value="pictomancer">ピクトマンサー</option> <option value="bluemage">青魔導士</option>
                    </select>
                    <div id="subjobSection">
                        <h3 class="section-title-nested">Sub Job</h3>
                        <div class="button-grid">
                            <button data-value="paladin">ナイト</button> <button data-value="warrior">戦士</button> <button data-value="darkknight">暗黒騎士</button> <button data-value="gunbreaker">ガンブレイカー</button> <button data-value="whitemage">白魔導士</button> <button data-value="scholar">学者</button> <button data-value="astrologian">占星術師</button> <button data-value="sage">賢者</button> <button data-value="monk">モンク</option> <button data-value="dragoon">竜騎士</button> <button data-value="ninja">忍者</button> <button data-value="samurai">侍</button> <button data-value="reaper">リーパー</button> <button data-value="viper">ヴァイパー</button> <button data-value="bard">吟遊詩人</button> <button data-value="machinist">機工士</button> <button data-value="dancer">踊り子</option> <button data-value="blackmage">黒魔導士</button> <button data-value="summoner">召喚士</button> <button data-value="redmage">赤魔導士</option> <option value="pictomancer">ピクトマンサー</option> <button data-value="bluemage">青魔導士</button>
                            <div class="grid-break"></div>
                            <button data-value="carpenter">木工師</button> <button data-value="blacksmith">鍛冶師</button> <button data-value="armorer">甲冑師</button> <button data-value="goldsmith">彫金師</button> <button data-value="leatherworker">革細工師</button> <button data-value="weaver">裁縫師</button> <button data-value="alchemist">錬金術師</button> <button data-value="culinarian">調理師</button> <button data-value="miner">採掘師</button> <button data-value="botanist">園芸師</button> <button data-value="fisher">漁師</button>
                        </div>
                    </div>
                </div>

                <button id="downloadBtn" class="generate-btn">
                    <img src="./assets/favicon.png" alt="generate card">
                    <span>この内容で作る？🐕</span>
                </button>
            </div>
        </aside>
    </div>

    <footer class="site-footer">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
        <a href="https://x.com/yypome" target="_blank" rel="noopener noreferrer">design @yypome</a>
    </footer>

    <button id="toTopBtn" title="トップに戻る">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
    
    <div id="saveModal" class="modal-overlay hidden">
        <div class="modal-content">
            <button id="closeModal" class="close-button">&times;</button>
            <h3>画像の保存方法</h3>
            <p>画像を長押しして「"写真"に追加」を選択してください。</p>
            <img id="modalImage" src="" alt="生成されたカード">
        </div>
    </div>

  </div>
  <script src="./script/main.js"></script>
</body>
</html>
