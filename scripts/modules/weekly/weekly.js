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
                const isLongSubject = cls.subject.length > 4;
                html += `
                    <td class="class-cell">
                        <div class="mini-subject ${isLongSubject ? 'long-text' : ''}">${cls.subject}</div>
                        <div class="mini-teacher">${cls.teacher || ''}</div>
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
