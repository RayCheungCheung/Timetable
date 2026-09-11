// ================= 全域變數 =================
let scheduleData = {};
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

// ================= 初始化：載入 JSON 資料 =================
async function initApp() {
    try {
        const response = await fetch('schedule.json');
        scheduleData = await response.json();
        
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
                載入課表失敗，請確認 schedule.json 是否存在。
            </div>`;
    }
}

// ================= 頁面切換邏輯 =================
function switchPage(pageId, mode = 'tomorrow') {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'page-schedule') {
        renderSchedule(mode);
        const backBtn = document.getElementById('schedule-back-btn');
        if (mode === 'today') {
            backBtn.onclick = () => switchPage('page-realtime');
        } else {
            backBtn.onclick = () => switchPage('page-menu');
        }
    }
    
    if (pageId === 'page-realtime') {
        updateRealtimeStatus();
    }
}

// ================= 功能：渲染課表 =================
function renderSchedule(mode) {
    const today = new Date();
    let targetDate = new Date(today);
    
    if (mode === 'tomorrow') {
        targetDate.setDate(today.getDate() + 1);
    }
    
    const dayOfWeek = targetDate.getDay();
    const dateString = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日(${dayNames[dayOfWeek]})`;
    
    document.getElementById('schedule-title-text').textContent = mode === 'tomorrow' ? '明日課表' : '今日課表';
    document.getElementById('schedule-date-text').textContent = (mode === 'tomorrow' ? '明天日期是' : '今天是') + dateString;
    
    const listContainer = document.getElementById('schedule-list-container');
    const classes = scheduleData[dayOfWeek];
    
    if (!classes || classes.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#b0b5d1; font-size:22px; font-weight:bold;">🎉 今日/明日沒有課堂！</div>`;
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
        if (mode === 'today') {
            if (currentSeconds >= startTotal && currentSeconds < endTotal) {
                isCurrent = true;
            }
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
}

// ================= 功能：即時倒數 =================
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

    const lunchStartSeconds = 12 * 3600 + 15 * 60; // 12:15
    const lunchEndSeconds = 14 * 3600;             // 14:00
    const isLunch = currentSeconds >= lunchStartSeconds && currentSeconds < lunchEndSeconds;

    const schoolEndSeconds = 15 * 3600 + 45 * 60;
    const isAfterSchool = currentSeconds >= schoolEndSeconds;

    const container = document.getElementById('status-container');
    let html = '';

    // ================= 處理 NOW 區塊 =================
    if (isLunch) {
        const remainingSeconds = lunchEndSeconds - currentSeconds;
        html += `
            <div class="status-card now">
                <div class="status-header">
                    <div>NOW</div>
                    <div class="countdown">
                        <div class="countdown-label">距離<br>上課時間</div>
                        <div>${formatTime(remainingSeconds)}</div>
                    </div>
                </div>
                <div class="status-body">
                    <div class="subject">午休</div>
                    <div class="time-range">12:15 ~ 14:00</div>
                </div>
            </div>
        `;
    } else if (currentSubject) {
        const isLongSubject = currentSubject.subject.length > 4;
        html += `
            <div class="status-card now">
                <div class="status-header">
                    <div>NOW</div>
                    <div class="countdown">
                        <div class="countdown-label">剩餘<br>時間</div>
                        <div>${formatTime(timeToNextEndInSeconds)}</div>
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
                        <div>放學</div>
                    </div>
                </div>
                <div class="status-body" style="background-color: #2c2c2e;">
                    <div class="subject" style="font-size: 28px;">已放學 🎉</div>
                    <div class="time-range" style="background-color: #555;">15:45 下課</div>
                </div>
            </div>
        `;
    } else if (!currentSubject) {
        // 小休狀態 (利用 currentIndex 搵返上一堂課嘅結束時間)
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
                            <div>${formatTime(timeToNextStart)}</div>
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
                            <div>無課</div>
                        </div>
                    </div>
                    <div class="status-body" style="background-color: #2c2c2e;">
                        <div class="subject" style="font-size: 28px;">今日無課堂</div>
                    </div>
                </div>
            `;
        }
    }

    // ================= 處理 Coming Up 區塊 (顯示下一個即將發生嘅事件) =================
    if (!isAfterSchool) {
        if (currentSubject) {
            // 正在上課：Coming Up 顯示下一個事件 (可能係小休或午休或下一堂課)
            let nextEventName = "小休";
            let nextEventTime = "";
            let countdownSeconds = 0;

            if (currentSubject.end === "12:15") {
                // 下一節係午休
                nextEventName = "午休";
                nextEventTime = "12:15 ~ 14:00";
                countdownSeconds = timeToNextEndInSeconds;
            } else {
                // 下一節係小休或下一堂課
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
                            <div>${formatTime(countdownSeconds)}</div>
                        </div>
                    </div>
                    <div class="status-body">
                        <div class="subject">${nextEventName}</div>
                        <div class="time-range">${nextEventTime}</div>
                    </div>
                </div>
            `;
        } else if (isLunch) {
            // 午休時：Coming Up 顯示「午休」
            const remainingSeconds = lunchEndSeconds - currentSeconds;
            html += `
                <div class="status-card coming">
                    <div class="status-header">
                        <div>Coming<br>Up</div>
                        <div class="countdown">
                            <div class="countdown-label">距離<br>午休結束</div>
                            <div>${formatTime(remainingSeconds)}</div>
                        </div>
                    </div>
                    <div class="status-body">
                        <div class="subject">午休</div>
                        <div class="time-range">12:15 ~ 14:00</div>
                    </div>
                </div>
            `;
        } else {
            // 小休時：Coming Up 顯示下一堂課
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
                                <div>${formatTime(timeToNextStart)}</div>
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

    container.innerHTML = html;
}

// ================= 輔助函式：將秒數格式化為 MM:SS =================
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ================= 啟動 App =================
window.onload = initApp;
