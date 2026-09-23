// ================= 全域變數 =================
let scheduleData = {};
let holidaysData = [];
let scheduleLoadFailed = false;
let scheduleLoadFailedUrl = '';
let scheduleLoadFailedReason = '';
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
let currentTab = 'page-realtime';

// ================= 初始化 =================
async function initApp() {
    await showSplashScreen();

    try {
        const scheduleUrl = appUrl('data/schedule.json');
        scheduleLoadFailedUrl = scheduleUrl;
        const response = await fetch(scheduleUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        // 靜態主機／代理有時會回傳 200 但內容係 HTML（404 頁、登入頁），要分開講清楚
        const raw = await response.text();
        try {
            scheduleData = JSON.parse(raw);
        } catch (parseError) {
            throw new Error('伺服器回傳嘅唔係 JSON（可能係 404 頁面或被攔截），請對照下面嘅網址');
        }
    } catch (error) {
        console.error('載入課表失敗:', error);
        scheduleLoadFailed = true;
        scheduleLoadFailedReason = error && error.message ? error.message : String(error);
        scheduleData = {};
    }

    try {
        const holidayResponse = await fetch(appUrl('data/holidays.json'));
        const holidayData = await holidayResponse.json();
        holidaysData = holidayData.holidays || [];
    } catch (e) {
        console.warn('載入假期資料失敗:', e);
        holidaysData = [];
    }

    initTheme();
    initSearch();
    initCardExpand();
    initCalendar();

    renderWeeklyGrid();
    renderHolidays();

    if (scheduleLoadFailed) {
        renderScheduleLoadError();
    }

    switchTab('page-realtime');

    // 等 DOM 渲染完成後，初始化選中塊位置
    setTimeout(initNavIndicator, 150);
    window.addEventListener('resize', initNavIndicator);

    setInterval(() => {
        if (document.getElementById('page-realtime').classList.contains('active')) {
            updateRealtimeStatus();
        }
    }, 1000);
}

// ================= 課表載入失敗提示 =================
function renderScheduleLoadError() {
    const container = document.getElementById('status-container');
    if (!container) return;

    // file:// 直接開檔時，瀏覽器基於安全性會封鎖 fetch 本機檔案
    const isFileProtocol = location.protocol === 'file:';
    const reason = isFileProtocol
        ? '偵測到你係直接打開 index.html，瀏覽器唔准 file:// 用 fetch 讀取本機 JSON。'
        : `讀唔到課表檔案：${scheduleLoadFailedReason}`;
    const action = isFileProtocol
        ? '請用本機伺服器開啟（VS Code Live Server，或喺資料夾執行 python -m http.server）'
        : '請確認伺服器上面有 data/schedule.json，之後用 Ctrl + Shift + R 強制重新整理';
    // 顯示實際請求嘅網址，方便喺 GitHub Pages 對照係邊一段路徑出錯
    const debugLine = isFileProtocol
        ? ''
        : `<div class="teacher" style="word-break: break-all;">網址：${scheduleLoadFailedUrl}</div>`;

    container.innerHTML = `
        <div class="status-card now">
            <div class="status-header">
                <div>ERROR</div>
            </div>
            <div class="status-body">
                <div class="subject long-text">載入課表失敗</div>
                <div class="teacher">${reason}</div>
                ${debugLine}
                <div class="time-range">${action}</div>
            </div>
        </div>
    `;
}

// ================= Splash Screen 控制 =================
function showSplashScreen() {
    return new Promise((resolve) => {
        const splash = document.getElementById('splash-screen');
        if (!splash) {
            resolve();
            return;
        }

        setTimeout(() => {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.classList.add('removed');
                setTimeout(() => {
                    if (splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                    resolve();
                }, 100);
            }, 300);
        }, 1200);
    });
}

// ================= Tab 切換（Liquid Glass 版） =================
function switchTab(pageId) {
    const navItems = document.querySelectorAll('.nav-item');
    const indicator = document.getElementById('nav-indicator');

    let activeIndex = -1;

    navItems.forEach((item, index) => {
        const isActive = item.dataset.tab === pageId;
        item.classList.toggle('active', isActive);
        if (isActive) activeIndex = index;
    });

    if (indicator && activeIndex !== -1 && navItems[activeIndex]) {
        const targetItem = navItems[activeIndex];
        const capsule = targetItem.parentElement;
        const capsuleRect = capsule.getBoundingClientRect();
        const itemRect = targetItem.getBoundingClientRect();

        const offsetLeft = itemRect.left - capsuleRect.left;
        const itemWidth = itemRect.width;
        const indicatorWidth = Math.max(itemWidth - 8, 56);

        indicator.classList.add('is-sliding');

        indicator.style.width = `${indicatorWidth}px`;
        indicator.style.transform = `translateX(${offsetLeft + 4}px)`;

        clearTimeout(indicator._slideTimer);
        indicator._slideTimer = setTimeout(() => {
            indicator.classList.remove('is-sliding');
        }, 500);
    }

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    currentTab = pageId;

    if (pageId === 'page-schedule') renderSchedule('tomorrow');
    if (pageId === 'page-realtime') updateRealtimeStatus();
    if (pageId === 'page-weekly') renderWeeklyGrid();
    if (pageId === 'page-calendar') renderCalendar();
    if (pageId === 'page-holidays') renderHolidays();
}

// ================= 初始化選中塊位置 =================
function initNavIndicator() {
    const activeItem = document.querySelector('.nav-item.active');
    const indicator = document.getElementById('nav-indicator');
    if (!activeItem || !indicator) return;

    const capsule = activeItem.parentElement;
    const capsuleRect = capsule.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const offsetLeft = itemRect.left - capsuleRect.left;
    const itemWidth = itemRect.width;
    const indicatorWidth = Math.max(itemWidth - 8, 56);

    indicator.style.width = `${indicatorWidth}px`;
    indicator.style.transform = `translateX(${offsetLeft + 4}px)`;
}

// ================= 渲染課表 =================
function renderSchedule(mode) {
    const today = new Date();
    let targetDate = new Date(today);
    if (mode === 'tomorrow') targetDate.setDate(today.getDate() + 1);

    const dayOfWeek = targetDate.getDay();
    const dateString = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日(${dayNames[dayOfWeek]})`;

    document.getElementById('schedule-title-text').textContent = mode === 'tomorrow' ? '明日課表' : '今日課表';
    document.getElementById('schedule-date-text').textContent = (mode === 'tomorrow' ? '明天日期是' : '今天是') + dateString;

    const listContainer = document.getElementById('schedule-list-container');
    const classes = scheduleData[dayOfWeek];

    if (!classes || classes.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:60px 20px; color:var(--text-muted); font-size:22px; font-weight:bold;">🎉 今日/明日沒有課堂！</div>`;
        return;
    }

    const now = new Date();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let html = '';
    classes.forEach(item => {
        const [startH, startM] = item.start.split(':').map(Number);
        const [endH, endM] = item.end.split(':').map(Number);
        const startTotal = startH * 3600 + startM * 60;
        const endTotal = endH * 3600 + endM * 60;

        let isCurrent = false;
        if (mode === 'today' && currentSeconds >= startTotal && currentSeconds < endTotal) {
            isCurrent = true;
        }

        const isLongSubject = item.subject.length > 4;

        html += `
            <div class="class-card ${isCurrent ? 'current-class' : ''}">
                <div class="period">第<br><span>${item.period}</span><br>節</div>
                <div class="info">
                    <div class="subject ${isLongSubject ? 'long-text' : ''}">${item.subject}</div>
                    ${item.teacher ? `<div class="teacher">${item.teacher}</div>` : ''}
                    <div class="time">${item.start} ~ ${item.end}</div>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
    if (typeof animateCardsIn === 'function') animateCardsIn(listContainer);
}

// ================= 即時倒數 =================
function updateRealtimeStatus() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('live-clock').textContent = `${hh}:${mm}:${ss}`;

    // 課表載入失敗時，保留錯誤提示卡，唔好用空資料覆蓋
    if (scheduleLoadFailed) return;

    const currentDay = now.getDay();
    const currentClasses = scheduleData[currentDay] || [];
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let currentSubject = null;
    let currentIndex = -1;
    let timeToNextEndInSeconds = 0;

    for (let i = 0; i < currentClasses.length; i++) {
        const cls = currentClasses[i];
        const [startH, startM] = cls.start.split(':').map(Number);
        const [endH, endM] = cls.end.split(':').map(Number);
        const startTotalSeconds = startH * 3600 + startM * 60;
        const endTotalSeconds = endH * 3600 + endM * 60;

        if (currentSeconds >= startTotalSeconds && currentSeconds < endTotalSeconds) {
            currentSubject = cls;
            currentIndex = i;
            timeToNextEndInSeconds = endTotalSeconds - currentSeconds;
        }
    }

    const lunchStartSeconds = 12 * 3600 + 15 * 60;
    const lunchEndSeconds = 14 * 3600 + 10 * 60;
    const isLunch = currentSeconds >= lunchStartSeconds && currentSeconds < lunchEndSeconds;

    const schoolEndSeconds = 15 * 3600 + 45 * 60;
    const isAfterSchool = currentSeconds >= schoolEndSeconds;

    const container = document.getElementById('status-container');
    let html = '';

    if (isLunch) {
        const isSaturday = currentDay === 6;

        if (isSaturday) {
            const remainingSeconds = lunchEndSeconds - currentSeconds;
            html += `
                <div class="status-card now">
                    <div class="status-header">
                        <div>NOW</div>
                        <div class="countdown">
                            <div class="countdown-label">距離<br>上課時間</div>
                            <div class="countdown-number">${formatTime(remainingSeconds)}</div>
                        </div>
                    </div>
                    <div class="status-body">
                        <div class="subject">午休</div>
                        <div class="time-range">12:15 ~ 14:10</div>
                    </div>
                </div>
            `;
        } else {
            const faceStartSeconds = 13 * 3600 + 30 * 60;
            const faceEndSeconds = 14 * 3600 + 5 * 60;

            if (currentSeconds < faceStartSeconds) {
                const remaining = faceStartSeconds - currentSeconds;
                html += `
                    <div class="status-card now">
                        <div class="status-header">
                            <div>NOW</div>
                            <div class="countdown">
                                <div class="countdown-label">距離<br>刷臉開始</div>
                                <div class="countdown-number">${formatTime(remaining)}</div>
                            </div>
                        </div>
                        <div class="status-body">
                            <div class="subject">午休</div>
                            <div class="time-range">12:15 ~ 13:30</div>
                        </div>
                    </div>
                `;
            } else if (currentSeconds >= faceStartSeconds && currentSeconds < faceEndSeconds) {
                const remaining = faceEndSeconds - currentSeconds;
                const lunchRemaining = lunchEndSeconds - currentSeconds;
                let timeRangeText = lunchRemaining > 0
                    ? `距離午休完結 ${formatTime(lunchRemaining)}`
                    : `午休已完結`;

                html += `
                    <div class="status-card now">
                        <div class="status-header">
                            <div>NOW</div>
                            <div class="countdown">
                                <div class="countdown-label">刷臉<br>剩餘時間</div>
                                <div class="countdown-number">${formatTime(remaining)}</div>
                            </div>
                        </div>
                        <div class="status-body">
                            <div class="subject">刷臉中</div>
                            <div class="time-range">${timeRangeText}</div>
                        </div>
                    </div>
                `;
            } else {
                const remainingSeconds = lunchEndSeconds - currentSeconds;
                html += `
                    <div class="status-card now">
                        <div class="status-header">
                            <div>NOW</div>
                            <div class="countdown">
                                <div class="countdown-label">距離<br>上課時間</div>
                                <div class="countdown-number">${formatTime(remainingSeconds)}</div>
                            </div>
                        </div>
                        <div class="status-body">
                            <div class="subject">午休</div>
                            <div class="time-range">14:05 ~ 14:10</div>
                        </div>
                    </div>
                `;
            }
        }
    } else if (currentSubject) {
        const isLongSubject = currentSubject.subject.length > 4;
        html += `
            <div class="status-card now">
                <div class="status-header">
                    <div>NOW</div>
                    <div class="countdown">
                        <div class="countdown-label">剩餘<br>時間</div>
                        <div class="countdown-number">${formatTime(timeToNextEndInSeconds)}</div>
                    </div>
                </div>
                <div class="status-body">
                    <div class="subject ${isLongSubject ? 'long-text' : ''}">${currentSubject.subject}</div>
                    <div class="teacher">${currentSubject.teacher || ''}</div>
                    <div class="time-range">${currentSubject.start} ~ ${currentSubject.end}</div>
                </div>
            </div>
        `;
    } else if (isAfterSchool) {
        html += `
            <div class="status-card now dismissed">
                <div class="status-header">
                    <div>NOW</div>
                    <div class="countdown">
                        <div class="countdown-label">狀態</div>
                        <div class="countdown-number">放學</div>
                    </div>
                </div>
                <div class="status-body">
                    <div class="subject dismissed-subject">已放學 🎉</div>
                    <div class="time-range dismissed-time">15:45 下課</div>
                </div>
            </div>
        `;
    } else if (!currentSubject) {
        // 小休時段：取最近一堂已完結課堂嘅結束時間做開始時間
        let lastClassEnd = "";
        for (let i = 0; i < currentClasses.length; i++) {
            const cls = currentClasses[i];
            const [endH, endM] = cls.end.split(':').map(Number);
            if (endH * 3600 + endM * 60 <= currentSeconds) {
                lastClassEnd = cls.end;
            }
        }
        let nextSubject = null;
        for (let i = 0; i < currentClasses.length; i++) {
            const cls = currentClasses[i];
            const [startH, startM] = cls.start.split(':').map(Number);
            const startTotalSeconds = startH * 3600 + startM * 60;
            if (currentSeconds < startTotalSeconds) {
                nextSubject = cls;
                break;
            }
        }
        if (nextSubject) {
            const [startH, startM] = nextSubject.start.split(':').map(Number);
            const startTotalSeconds = startH * 3600 + startM * 60;
            const timeToNextStart = startTotalSeconds - currentSeconds;
            html += `
                <div class="status-card now">
                    <div class="status-header">
                        <div>NOW</div>
                        <div class="countdown">
                            <div class="countdown-label">距離<br>上課時間</div>
                            <div class="countdown-number">${formatTime(timeToNextStart)}</div>
                        </div>
                    </div>
                    <div class="status-body">
                        <div class="subject">小休</div>
                        <div class="time-range">${lastClassEnd} ~ ${nextSubject.start}</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="status-card now" style="background-color: #444;">
                    <div class="status-header" style="background-color: #666;">
                        <div>NOW</div>
                        <div class="countdown">
                            <div class="countdown-label">狀態</div>
                            <div class="countdown-number">無課</div>
                        </div>
                    </div>
                    <div class="status-body" style="background-color: #2c2c2e;">
                        <div class="subject" style="font-size: 28px;">今日無課堂</div>
                    </div>
                </div>
            `;
        }
    }

    if (!isAfterSchool) {
        if (isLunch) {
            let afternoonSubject = null;
            for (let i = 0; i < currentClasses.length; i++) {
                const cls = currentClasses[i];
                const [startH, startM] = cls.start.split(':').map(Number);
                const startTotalSeconds = startH * 3600 + startM * 60;
                if (startTotalSeconds >= lunchEndSeconds) {
                    afternoonSubject = cls;
                    break;
                }
            }
            if (afternoonSubject) {
                const [startH, startM] = afternoonSubject.start.split(':').map(Number);
                const startTotalSeconds = startH * 3600 + startM * 60;
                const timeToAfternoon = startTotalSeconds - currentSeconds;
                const isLongSubject = afternoonSubject.subject.length > 4;
                html += `
                    <div class="status-card coming">
                        <div class="status-header">
                            <div>Coming<br>Up</div>
                            <div class="countdown">
                                <div class="countdown-label">距離<br>下堂課</div>
                                <div class="countdown-number">${formatTime(timeToAfternoon)}</div>
                            </div>
                        </div>
                        <div class="status-body">
                            <div class="subject ${isLongSubject ? 'long-text' : ''}">${afternoonSubject.subject}</div>
                            <div class="teacher">${afternoonSubject.teacher || ''}</div>
                            <div class="time-range">${afternoonSubject.start} ~ ${afternoonSubject.end}</div>
                        </div>
                    </div>
                `;
            }
        } else if (currentSubject) {
            let nextEventName = "小休";
            let nextEventTime = "";
            let countdownSeconds = 0;
            if (currentSubject.end === "12:15") {
                nextEventName = "午休";
                nextEventTime = "12:15 ~ 14:10";
                countdownSeconds = timeToNextEndInSeconds;
            } else {
                const nextClass = currentClasses[currentIndex + 1];
                nextEventName = "小休";
                nextEventTime = `${currentSubject.end} ~ ${nextClass ? nextClass.start : "15:45"}`;
                countdownSeconds = timeToNextEndInSeconds;
            }
            html += `
                <div class="status-card coming">
                    <div class="status-header">
                        <div>Coming<br>Up</div>
                        <div class="countdown">
                            <div class="countdown-label">距離<br>${nextEventName}</div>
                            <div class="countdown-number">${formatTime(countdownSeconds)}</div>
                        </div>
                    </div>
                    <div class="status-body">
                        <div class="subject">${nextEventName}</div>
                        <div class="time-range">${nextEventTime}</div>
                    </div>
                </div>
            `;
        } else {
            let nextSubject = null;
            for (let i = 0; i < currentClasses.length; i++) {
                const cls = currentClasses[i];
                const [startH, startM] = cls.start.split(':').map(Number);
                const startTotalSeconds = startH * 3600 + startM * 60;
                if (currentSeconds < startTotalSeconds) {
                    nextSubject = cls;
                    break;
                }
            }
            if (nextSubject) {
                const [startH, startM] = nextSubject.start.split(':').map(Number);
                const startTotalSeconds = startH * 3600 + startM * 60;
                const timeToNextStart = startTotalSeconds - currentSeconds;
                const isLongSubject = nextSubject.subject.length > 4;
                html += `
                    <div class="status-card coming">
                        <div class="status-header">
                            <div>Coming<br>Up</div>
                            <div class="countdown">
                                <div class="countdown-label">距離<br>下堂課</div>
                                <div class="countdown-number">${formatTime(timeToNextStart)}</div>
                            </div>
                        </div>
                        <div class="status-body">
                            <div class="subject ${isLongSubject ? 'long-text' : ''}">${nextSubject.subject}</div>
                            <div class="teacher">${nextSubject.teacher || ''}</div>
                            <div class="time-range">${nextSubject.start} ~ ${nextSubject.end}</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    const existingNowCard = container.querySelector('.status-card.now');
    const existingComingCard = container.querySelector('.status-card.coming');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const newNowCard = tempDiv.querySelector('.status-card.now');
    const newComingCard = tempDiv.querySelector('.status-card.coming');

    const nowCardType = existingNowCard ? existingNowCard.querySelector('.subject')?.textContent || '' : '';
    const newNowCardType = newNowCard ? newNowCard.querySelector('.subject')?.textContent || '' : '';
    const nowCardHeader = existingNowCard ? existingNowCard.querySelector('.countdown-label')?.textContent || '' : '';
    const newNowCardHeader = newNowCard ? newNowCard.querySelector('.countdown-label')?.textContent || '' : '';

    const needRebuild =
        !existingNowCard || !newNowCard ||
        nowCardType !== newNowCardType ||
        nowCardHeader !== newNowCardHeader ||
        (existingComingCard === null) !== (newComingCard === null) ||
        (existingComingCard && newComingCard &&
            (existingComingCard.querySelector('.subject')?.textContent || '') !== (newComingCard.querySelector('.subject')?.textContent || ''));

    if (needRebuild) {
        container.innerHTML = html;
        if (typeof animateCardsIn === 'function') animateCardsIn(container);
    } else {
        const updateCard = (existingCard, newCard) => {
            if (!existingCard || !newCard) return;
            const existingNumber = existingCard.querySelector('.countdown-number');
            const newNumber = newCard.querySelector('.countdown-number');
            if (existingNumber && newNumber) existingNumber.textContent = newNumber.textContent;

            const existingTimeRange = existingCard.querySelector('.time-range');
            const newTimeRange = newCard.querySelector('.time-range');
            if (existingTimeRange && newTimeRange) existingTimeRange.textContent = newTimeRange.textContent;

            const existingTeacher = existingCard.querySelector('.teacher');
            const newTeacher = newCard.querySelector('.teacher');
            if (existingTeacher && newTeacher) existingTeacher.textContent = newTeacher.textContent;
        };
        updateCard(existingNowCard, newNowCard);
        updateCard(existingComingCard, newComingCard);
    }
}

// ================= 輔助函式 =================
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ================= 搜尋功能 =================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        if (keyword === '') {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        const parsedDate = parseDateInput(keyword);
        let results = [];

        if (parsedDate) {
            results = searchByDate(parsedDate);
        } else {
            results = searchByKeyword(keyword);
        }

        if (results.length === 0) {
            searchResults.innerHTML = `<div class="search-empty">找不到相關結果 😢</div>`;
        } else {
            searchResults.innerHTML = results.map(r => r.html).join('');
        }
        searchResults.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

function parseDateInput(input) {
    const currentYear = new Date().getFullYear();
    const text = input.trim().toLowerCase();

    let match = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

    match = text.match(/^(\d{1,2})月(\d{1,2})日?$/);
    if (match) return new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));

    match = text.match(/^(\d{1,2})[\.\-\,\/](\d{1,2})$/);
    if (match) return new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));

    const monthNames = {
        january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
        april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
        august: 8, aug: 8, september: 9, sep: 9, sept: 9,
        october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
    };

    match = text.match(/^(\d{1,2})\s*(?:st|nd|rd|th)?\s+([a-z]+)$/);
    if (match && monthNames[match[2]]) return new Date(currentYear, monthNames[match[2]] - 1, parseInt(match[1]));

    match = text.match(/^([a-z]+)\s+(\d{1,2})\s*(?:st|nd|rd|th)?$/);
    if (match && monthNames[match[1]]) return new Date(currentYear, monthNames[match[1]] - 1, parseInt(match[2]));

    match = text.match(/^(\d{3,4})$/);
    if (match) {
        const num = match[1];
        if (num.length === 3) {
            const m = parseInt(num[0]);
            const d = parseInt(num.slice(1));
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(currentYear, m - 1, d);
        } else {
            const m = parseInt(num.slice(0, 2));
            const d = parseInt(num.slice(2));
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(currentYear, m - 1, d);
        }
    }

    return null;
}

function searchByDate(date) {
    const results = [];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();

    const matchedHolidays = holidaysData.filter(h => {
        if (!h.endDate) return h.date === dateStr;
        return dateStr >= h.date && dateStr <= h.endDate;
    });

    const isSunday = dayOfWeek === 0;
    const isHoliday = matchedHolidays.length > 0;

    if (isHoliday) {
        matchedHolidays.forEach(h => {
            results.push({
                html: `
                    <div class="search-item holiday-item">
                        <div class="search-day">🎉 假期</div>
                        <div class="search-subject">${h.emoji || '📅'} ${h.name}</div>
                        <div class="search-info">${h.date}${h.endDate && h.endDate !== h.date ? ' ~ ' + h.endDate : ''}</div>
                        ${h.note ? `<div class="search-info">${h.note}</div>` : ''}
                    </div>
                `
            });
        });
        return results;
    }

    if (isSunday) {
        results.push({
            html: `
                <div class="search-item">
                    <div class="search-day">📅 ${dateStr}（週日）</div>
                    <div class="search-subject">週日</div>
                    <div class="search-info">放假一天</div>
                </div>
            `
        });
        return results;
    }

    const classes = scheduleData[dayOfWeek] || [];
    if (classes.length > 0) {
        classes.forEach(cls => {
            results.push({
                html: `
                    <div class="search-item">
                        <div class="search-day">📅 ${dateStr}（星期${dayNames[dayOfWeek]}）第${cls.period}節</div>
                        <div class="search-subject">${cls.subject}</div>
                        <div class="search-info">${cls.teacher || ''} · ${cls.start} ~ ${cls.end}</div>
                    </div>
                `
            });
        });
    } else {
        results.push({
            html: `
                <div class="search-item">
                    <div class="search-day">📅 ${dateStr}（星期${dayNames[dayOfWeek]}）</div>
                    <div class="search-subject">沒有特別事項</div>
                    <div class="search-info">沒有假期或課堂</div>
                </div>
            `
        });
    }

    return results;
}

function searchByKeyword(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    Object.keys(scheduleData).forEach(day => {
        scheduleData[day].forEach(cls => {
            const subjectMatch = cls.subject.toLowerCase().includes(lowerKeyword);
            const teacherMatch = cls.teacher && cls.teacher.toLowerCase().includes(lowerKeyword);
            if (subjectMatch || teacherMatch) {
                results.push({
                    html: `
                        <div class="search-item">
                            <div class="search-day">星期${dayNames[day]} 第${cls.period}節</div>
                            <div class="search-subject">${cls.subject}</div>
                            <div class="search-info">${cls.teacher || ''} · ${cls.start} ~ ${cls.end}</div>
                        </div>
                    `
                });
            }
        });
    });

    return results;
}

// ================= 啟動 =================
window.onload = initApp;