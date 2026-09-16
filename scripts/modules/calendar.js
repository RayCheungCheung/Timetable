// ================= 功能 8：Google Calendar 風格月曆 =================
let calendarCurrentDate = new Date();
let calendarEvents = [];
let calendarSelectedDate = null;

async function initCalendar() {
    try {
        const response = await fetch('data/events.json');
        const data = await response.json();
        calendarEvents = data.events || [];

        // 從 localStorage 讀取用戶新增的事件
        const userEvents = JSON.parse(localStorage.getItem('userCalendarEvents') || '[]');
        calendarEvents = calendarEvents.concat(userEvents);

        renderCalendar();
    } catch (error) {
        console.error('載入事件失敗:', error);
        calendarEvents = [];
        renderCalendar();
    }
}

function changeCalendarMonth(offset) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + offset);
    renderCalendar();
}

function goToCalendarToday() {
    calendarCurrentDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const titleEl = document.getElementById('calendar-title');
    if (titleEl) titleEl.textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = fmtDate(today);

    let html = '';

    // 上個月的尾巴
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="cal-cell other-month"><div class="cal-num">${prevMonthDays - i}</div></div>`;
    }

    // 本月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = calendarEvents.filter(e => e.date === dateStr);
        const isToday = dateStr === todayStr;

        let eventsHtml = '';
        dayEvents.slice(0, 3).forEach(e => {
            eventsHtml += `<div class="cal-event ${e.type}">${e.emoji || ''} ${e.title}</div>`;
        });
        if (dayEvents.length > 3) {
            eventsHtml += `<div class="cal-event more">+${dayEvents.length - 3} 更多</div>`;
        }

        html += `
            <div class="cal-cell ${isToday ? 'today' : ''}" onclick="selectCalendarDate('${dateStr}')">
                <div class="cal-num">${day}</div>
                <div class="cal-events">${eventsHtml}</div>
            </div>
        `;
    }

    // 下個月的開頭
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="cal-cell other-month"><div class="cal-num">${i}</div></div>`;
    }

    const gridEl = document.getElementById('calendar-grid');
    if (gridEl) gridEl.innerHTML = html;

    selectCalendarDate(todayStr);
}

function selectCalendarDate(dateStr) {
    calendarSelectedDate = dateStr;
    const dayEvents = calendarEvents.filter(e => e.date === dateStr);
    const titleEl = document.getElementById('calendar-events-title');
    const listEl = document.getElementById('calendar-events-list');

    if (!titleEl || !listEl) return;

    const [y, m, d] = dateStr.split('-');
    titleEl.textContent = `${y}年${parseInt(m)}月${parseInt(d)}日 的事件`;

    if (dayEvents.length === 0) {
        listEl.innerHTML = `<div class="cal-event-empty">這天沒有事件</div>`;
        return;
    }

    listEl.innerHTML = dayEvents.map(e => `
        <div class="cal-event-item ${e.type}">
            <div class="cal-event-emoji">${e.emoji || getCalEventEmoji(e.type)}</div>
            <div class="cal-event-info">
                <div class="cal-event-title">${e.title}</div>
                <div class="cal-event-type">${getCalTypeName(e.type)}</div>
            </div>
        </div>
    `).join('');
}

function getCalEventEmoji(type) {
    const emojis = { exam: '📝', homework: '📚', activity: '🎯', holiday: '🎉' };
    return emojis[type] || '📌';
}

function getCalTypeName(type) {
    const names = { exam: '測驗 / 考試', homework: '作業截止', activity: '活動', holiday: '假期' };
    return names[type] || '事件';
}

function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ================= 新增事件 =================
function openAddCalendarEventModal() {
    const modal = document.getElementById('add-calendar-event-modal');
    if (modal) modal.classList.add('active');

    const dateInput = document.getElementById('calendar-event-date');
    if (dateInput) {
        const d = calendarSelectedDate ? new Date(calendarSelectedDate) : new Date();
        dateInput.value = fmtDate(d);
    }

    const titleInput = document.getElementById('calendar-event-title');
    if (titleInput) titleInput.value = '';
}

function closeAddCalendarEventModal() {
    const modal = document.getElementById('add-calendar-event-modal');
    if (modal) modal.classList.remove('active');
}

function saveCalendarEvent() {
    const date = document.getElementById('calendar-event-date').value;
    const title = document.getElementById('calendar-event-title').value.trim();
    const type = document.getElementById('calendar-event-type').value;

    if (!date || !title) {
        alert('請填寫日期與事件名稱！');
        return;
    }

    const newEvent = {
        date: date,
        title: title,
        type: type,
        emoji: getCalEventEmoji(type)
    };

    const userEvents = JSON.parse(localStorage.getItem('userCalendarEvents') || '[]');
    userEvents.push(newEvent);
    localStorage.setItem('userCalendarEvents', JSON.stringify(userEvents));

    calendarEvents.push(newEvent);

    closeAddCalendarEventModal();
    renderCalendar();
    selectCalendarDate(date);
}
