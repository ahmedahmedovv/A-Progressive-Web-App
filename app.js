class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.init();
    }

    init() {
        this.renderHabits();
        this.setupEventListeners();
        this.updateProgress();
        this.displayDate();
    }

    displayDate() {
        const dateDisplay = document.getElementById('currentDate');
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }

    setupEventListeners() {
        const input = document.getElementById('habitInput');
        const addButton = document.querySelector('.add-button');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });

        addButton.addEventListener('click', () => this.addHabit());
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();
        
        if (name) {
            const habit = {
                id: Date.now(),
                name,
                dates: {},
                streak: 0
            };
            
            this.habits.unshift(habit);
            this.saveAndUpdate();
            input.value = '';
            this.showNotification('Habit added');
        }
    }

    toggleHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        const today = new Date().toDateString();
        
        if (habit) {
            habit.dates[today] ? delete habit.dates[today] : habit.dates[today] = true;
            this.updateStreak(habit);
            this.saveAndUpdate();
        }
    }

    updateStreak(habit) {
        let streak = 0;
        let currentDate = new Date();
        
        while (habit.dates[currentDate.toDateString()]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        habit.streak = streak;
    }

    updateProgress() {
        const today = new Date().toDateString();
        const completed = this.habits.filter(h => h.dates[today]).length;
        const total = this.habits.length;
        
        document.getElementById('completedToday').textContent = `${completed}/${total}`;
        document.getElementById('progressBar').style.width = total ? `${(completed/total) * 100}%` : '0%';
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        const today = new Date().toDateString();
        
        habitsList.innerHTML = this.habits.length ? this.habits.map(habit => `
            <div class="habit-item" data-id="${habit.id}">
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    ${habit.streak > 0 ? `<div class="streak">${habit.streak} day streak</div>` : ''}
                </div>
                <div class="checkbox ${habit.dates[today] ? 'checked' : ''}"
                     onclick="habitTracker.toggleHabit(${habit.id})"></div>
            </div>
        `).join('') : '<div class="empty-state">Add your first habit</div>';
    }

    saveAndUpdate() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
        this.renderHabits();
        this.updateProgress();
    }

    showNotification(message) {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.classList.add('show');
        setTimeout(() => snackbar.classList.remove('show'), 2000);
    }
}

window.habitTracker = new HabitTracker(); 