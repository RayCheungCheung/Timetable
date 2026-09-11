function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        
        if (keyword === '') {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }
        
        const results = [];
        Object.keys(scheduleData).forEach(day => {
            scheduleData[day].forEach(cls => {
                const subjectMatch = cls.subject.toLowerCase().includes(keyword);
                const teacherMatch = cls.teacher && cls.teacher.toLowerCase().includes(keyword);
                if (subjectMatch || teacherMatch) {
                    results.push({ day, dayName: dayNames[day], ...cls });
                }
            });
        });
        
        if (results.length === 0) {
            searchResults.innerHTML = `<div class="search-empty">找不到相關課堂 😢</div>`;
        } else {
            searchResults.innerHTML = results.map(r => `
                <div class="search-item">
                    <div class="search-day">星期${r.dayName} 第${r.period}節</div>
                    <div class="search-subject">${r.subject}</div>
                    <div class="search-info">${r.teacher || ''} · ${r.start} ~ ${r.end}</div>
                </div>
            `).join('');
        }
        searchResults.classList.add('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}
