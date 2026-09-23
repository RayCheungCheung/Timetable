// ================= 功能 8：日曆系統 =================
let calendarCurrentDate = new Date();
let calendarEvents = [];
let calendarSelectedDate = null;
let selectedEventType = 'exam';

const STORAGE_KEY = 'calendar_events';

// ================= 初始化 =================
async function initCalendar() {
    loadEventsFromStorage();

    if (calendarEvents.length === 0) {
        try {
            const response = await fetch(appUrl('data/events.json'));
            const data = await response.json();
            const defaultEvents = (data.events || []).map((e, index) => ({
                id: `default-${index}-${e.date}`,
                date: e.date,
                title: e.title,
                type: e.type || 'holiday',
                emoji: e.emoji || '📅'
            }));
            calendarEvents = defaultEvents;
            saveEventsToStorage();
        } catch (e) {
            console.warn('載入預設事件失敗:', e);
        }
    }

    renderCalendar();
}

// ================= localStorage =================
function loadEventsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        calendarEvents = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('讀取 localStorage 失敗:', e);
        calendarEvents = [];
    }
}

function saveEventsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(calendarEvents));
    } catch (e) {
        console.error('寫入 localStorage 失敗:', e);
    }
}

// ================= 月份切換 =================
function changeCalendarMonth(offset) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + offset);
    renderCalendar();
}

function goToCalendarToday() {
    calendarCurrentDate = new Date();
    renderCalendar();
}

// ================= 渲染月曆 =================
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

    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="cal-cell other-month"><div class="cal-num">${prevMonthDays - i}</div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = calendarEvents.filter(e => e.date === dateStr);
        const isToday = dateStr === todayStr;
        const hasEvents = dayEvents.length > 0;

        let eventsHtml = '';
        dayEvents.slice(0, 2).forEach(e => {
            eventsHtml += `<div class="cal-event ${e.type}">${e.emoji || ''} ${e.title}</div>`;
        });
        if (dayEvents.length > 2) {
            eventsHtml += `<div class="cal-event more">+${dayEvents.length - 2}</div>`;
        }

        html += `
            <div class="cal-cell ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" 
                 onclick="onCalendarDateClick('${dateStr}')">
                <div class="cal-num">${day}</div>
                ${hasEvents ? '<div class="cal-dot"></div>' : ''}
                <div class="cal-events">${eventsHtml}</div>
            </div>
        `;
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="cal-cell other-month"><div class="cal-num">${i}</div></div>`;
    }

    const gridEl = document.getElementById('calendar-grid');
    if (gridEl) gridEl.innerHTML = html;

    selectCalendarDate(todayStr);
}

// ================= 點擊日期格子（直接彈出新增事件） =================
function onCalendarDateClick(dateStr) {
    calendarSelectedDate = dateStr;
    selectCalendarDate(dateStr);
    openAddCalendarEventModal(dateStr);
}

// ================= 選擇日期 =================
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
            <button class="cal-event-delete" onclick="deleteCalendarEvent('${e.id}')" aria-label="刪除事件">✕</button>
        </div>
    `).join('');
}

// ================= 輔助 =================
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

// ================= 彈窗控制 =================
function openAddCalendarEventModal(dateStr) {
    const modal = document.getElementById('add-calendar-event-modal');
    if (!modal) return;

    const dateInput = document.getElementById('calendar-event-date');
    if (dateInput) {
        dateInput.value = dateStr || fmtDate(new Date());
    }

    updateDateDisplay(dateInput.value);

    const titleInput = document.getElementById('calendar-event-title');
    if (titleInput) titleInput.value = '';

    selectedEventType = 'exam';
    document.querySelectorAll('.gcal-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.type === 'exam');
    });

    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeAddCalendarEventModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('add-calendar-event-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('active');
}

function selectEventType(type) {
    selectedEventType = type;
    const hiddenInput = document.getElementById('calendar-event-type');
    if (hiddenInput) hiddenInput.value = type;
    document.querySelectorAll('.gcal-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.type === type);
    });
}

function updateDateDisplay(dateStr) {
    const display = document.getElementById('gcal-date-display');
    if (!display || !dateStr) return;
    const d = new Date(dateStr);
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    display.textContent = `${months[d.getMonth()]}${d.getDate()}日 ${days[d.getDay()]}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('calendar-event-date');
    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            updateDateDisplay(e.target.value);
        });
    }
});

// ================= 儲存事件 =================
function saveCalendarEvent() {
    const date = document.getElementById('calendar-event-date').value;
    const title = document.getElementById('calendar-event-title').value.trim();
    const type = selectedEventType;

    if (!date || !title) {
        alert('請填寫標題與日期！');
        return;
    }

    const newEvent = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: date,
        title: title,
        type: type,
        emoji: getCalEventEmoji(type)
    };

    calendarEvents.push(newEvent);
    saveEventsToStorage();
    closeAddCalendarEventModal();
    renderCalendar();
    selectCalendarDate(date);
}

// ================= 刪除事件 =================
function deleteCalendarEvent(eventId) {
    if (!confirm('確定要刪除這個事件嗎？')) return;

    const originalLength = calendarEvents.length;
    calendarEvents = calendarEvents.filter(e => e.id !== eventId);

    if (calendarEvents.length === originalLength) return;

    saveEventsToStorage();
    renderCalendar();
    if (calendarSelectedDate) {
        selectCalendarDate(calendarSelectedDate);
    }
}