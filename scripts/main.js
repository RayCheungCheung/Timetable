// ================= 全域變數 =================
let scheduleData = {};
let holidaysData = [];
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

// ================= 初始化 =================
async function initApp() {
    try {
        const response = await fetch('data/schedule.json');
        scheduleData = await response.json();

        try {
            const holidayResponse = await fetch('data/holidays.json');
            const holidayData = await holidayResponse.json();
            holidaysData = holidayData.holidays || [];
        } catch (e) {
            console.warn('載入假期資料失敗:', e);
            holidaysData = [];
        }

        initTheme();
        initSearch();
        initCardExpand();

        renderWeeklyGrid();
        renderHolidays();

        switchPage('page-menu');

        setInterval(() => {
            if (document.getElementById('page-realtime').classList.contains('active')) {
                updateRealtimeStatus();
            }
        }, 1000);
    } catch (error) {
        console.error("載入課表失敗:", error);
        document.getElementById('app-content').innerHTML =
            `<div style="color: #ff3b30; text-align: center; padding: 50px; font-size: 18px;">
                載入課表失敗，請確認 data/schedule.json 是否存在。
            </div>`;
    }
}

// ================= 頁面切換 =================
function switchPage(pageId, mode = 'tomorrow') {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    targetPage.classList.add('active');

    if (typeof animatePageEnter === 'function') animatePageEnter(targetPage);

    if (pageId === 'page-schedule') {
        renderSchedule(mode);
        const backBtn = document.getElementById('schedule-back-btn');
        if (mode === 'today') {
            backBtn.onclick = () => switchPage('page-realtime');
        } else {
            backBtn.onclick = () => switchPage('page-menu');
        }
    }

    if (pageId === 'page-realtime') updateRealtimeStatus();
    if (pageId === 'page-weekly') renderWeeklyGrid();
    if (pageId === 'page-holidays') renderHolidays();
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

    // 午休：12:15 ~ 14:10（改咗做 14:10）
    const lunchStartSeconds = 12 * 3600 + 15 * 60;  // 12:15
    const lunchEndSeconds = 14 * 3600 + 10 * 60;    // 14:10（改咗）
    const isLunch = currentSeconds >= lunchStartSeconds && currentSeconds < lunchEndSeconds;

    const schoolEndSeconds = 15 * 3600 + 45 * 60;
    const isAfterSchool = currentSeconds >= schoolEndSeconds;

    const container = document.getElementById('status-container');
    let html = '';

    // ================= 處理 NOW 區塊 =================
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
            const faceStartSeconds = 13 * 3600 + 30 * 60; // 13:30
            const faceEndSeconds = 14 * 3600 + 5 * 60;    // 14:05

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

                let timeRangeText = '';
                if (lunchRemaining > 0) {
                    timeRangeText = `距離午休完結 ${formatTime(lunchRemaining)}`;
                } else {
                    timeRangeText = `午休已完結`;
                }

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
                // 14:05 ~ 14:10：午休尾段
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
            <div class="status-card now" style="background-color: #333;">
                <div class="status-header" style="background-color: #555;">
                    <div>NOW</div>
                    <div class="countdown">
                        <div class="countdown-label">狀態</div>
                        <div class="countdown-number">放學</div>
                    </div>
                </div>
                <div class="status-body" style="background-color: #2c2c2e;">
                    <div class="subject" style="font-size: 28px;">已放學 🎉</div>
                    <div class="time-range" style="background-color: #555;">15:45 下課</div>
                </div>
            </div>
        `;
    } else if (!currentSubject) {
        const lastClassEnd = currentIndex >= 0 ? currentClasses[currentIndex].end : "";
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

    // ================= 處理 Coming Up 區塊 =================
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

    // ================= 只更新數字，唔重建整個卡片（防止閃爍） =================
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
        !existingNowCard || 
        !newNowCard ||
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

    if (matchedHolidays.length > 0) {
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
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        results.push({
            html: `
                <div class="search-item">
                    <div class="search-day">📅 ${dateStr}（星期${dayNames[dayOfWeek]}）</div>
                    <div class="search-subject">週末</div>
                    <div class="search-info">放假一天</div>
                </div>
            `
        });
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
    }

    if (results.length === 0) {
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
