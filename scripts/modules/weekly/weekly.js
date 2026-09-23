// ================= 功能 3：本週課表總覽 =================
function renderWeeklyGrid() {
    const container = document.getElementById('weekly-grid-container');
    if (!container) return;

    const dayNamesFull = ['日', '一', '二', '三', '四', '五', '六'];

    let html = '<table class="weekly-table">';
    html += '<thead><tr><th></th>';
    for (let i = 1; i <= 6; i++) {
        html += `<th>週${dayNamesFull[i]}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let period = 1; period <= 7; period++) {
        html += `<tr><td class="period-cell">第${period}節</td>`;
        for (let day = 1; day <= 6; day++) {
            const classes = scheduleData[day] || [];
            const cls = classes.find(c => c.period === period);
            if (cls) {
                html += `
                    <td class="class-cell">
                        <div class="cell-content">
                            <div class="mini-subject" onclick="showSubjectModal('${cls.subject}')">${cls.subject}</div>
                            <div class="mini-teacher" onclick="showTeacherModal('${cls.teacher || ''}')">${cls.teacher || ''}</div>
                        </div>
                    </td>
                `;
            } else {
                html += '<td class="empty-cell">—</td>';
            }
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ================= 彈窗：顯示該老師嘅所有課堂 =================
function showTeacherModal(teacherName) {
    if (!teacherName) return;

    const classes = [];
    Object.keys(scheduleData).forEach(day => {
        scheduleData[day].forEach(cls => {
            if (cls.teacher === teacherName) {
                classes.push({
                    day: day,
                    dayName: ['日', '一', '二', '三', '四', '五', '六'][day],
                    ...cls
                });
            }
        });
    });

    if (classes.length === 0) return;

    classes.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.period - b.period;
    });

    const modalHtml = `
        <div class="info-modal-overlay" onclick="closeInfoModal(event)">
            <div class="info-modal-content" onclick="event.stopPropagation()">
                <div class="info-modal-header">
                    <div class="info-modal-title">
                        <span class="info-modal-icon">👨‍🏫</span>
                        <span>${teacherName}</span>
                    </div>
                    <button class="info-modal-close" onclick="closeInfoModal()">✕</button>
                </div>
                <div class="info-modal-subtitle">共 ${classes.length} 堂課</div>
                <div class="info-modal-list">
                    ${classes.map(cls => `
                        <div class="info-modal-item">
                            <div class="info-modal-item-day">週${cls.dayName} 第${cls.period}節</div>
                            <div class="info-modal-item-subject">${cls.subject}</div>
                            <div class="info-modal-item-time">${cls.start} ~ ${cls.end}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ================= 彈窗：顯示該科目嘅所有課堂 =================
function showSubjectModal(subjectName) {
    if (!subjectName) return;

    const classes = [];
    Object.keys(scheduleData).forEach(day => {
        scheduleData[day].forEach(cls => {
            if (cls.subject === subjectName) {
                classes.push({
                    day: day,
                    dayName: ['日', '一', '二', '三', '四', '五', '六'][day],
                    ...cls
                });
            }
        });
    });

    if (classes.length === 0) return;

    classes.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.period - b.period;
    });

    const modalHtml = `
        <div class="info-modal-overlay" onclick="closeInfoModal(event)">
            <div class="info-modal-content" onclick="event.stopPropagation()">
                <div class="info-modal-header">
                    <div class="info-modal-title">
                        <span class="info-modal-icon">📚</span>
                        <span>${subjectName}</span>
                    </div>
                    <button class="info-modal-close" onclick="closeInfoModal()">✕</button>
                </div>
                <div class="info-modal-subtitle">共 ${classes.length} 堂課</div>
                <div class="info-modal-list">
                    ${classes.map(cls => `
                        <div class="info-modal-item">
                            <div class="info-modal-item-day">週${cls.dayName} 第${cls.period}節</div>
                            <div class="info-modal-item-subject">${cls.teacher || '—'}</div>
                            <div class="info-modal-item-time">${cls.start} ~ ${cls.end}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ================= 關閉彈窗 =================
function closeInfoModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.querySelector('.info-modal-overlay');
    if (modal) modal.remove();
}