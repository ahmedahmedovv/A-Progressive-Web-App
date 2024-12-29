class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.init();
    }

    init() {
        this.renderHabits();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addHabit = () => {
            const input = document.getElementById('habitInput');
            const habitName = input.value.trim();
            
            if (habitName) {
                this.habits.push({
                    id: Date.now(),
                    name: habitName,
                    dates: {},
                    streak: 0
                });
                this.saveHabits();
                this.renderHabits();
                input.value = '';
            }
        };
    }

    toggleDate(habitId, date) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            if (habit.dates[date]) {
                delete habit.dates[date];
            } else {
                habit.dates[date] = true;
            }
            this.updateStreak(habit);
            this.saveHabits();
            this.renderHabits();
        }
    }

    updateStreak(habit) {
        let streak = 0;
        const today = new Date();
        let currentDate = new Date();

        while (habit.dates[currentDate.toDateString()]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        habit.streak = streak;
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        habitsList.innerHTML = '';

        this.habits.forEach(habit => {
            const today = new Date().toDateString();
            const isChecked = habit.dates[today] ? 'checked' : '';
            
            const habitElement = document.createElement('div');
            habitElement.className = 'habit-item';
            habitElement.innerHTML = `
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    <span class="streak">🔥 ${habit.streak} days</span>
                </div>
                <label class="checkbox">
                    <input type="checkbox" ${isChecked}
                        onclick="habitTracker.toggleDate(${habit.id}, '${today}')">
                    <span class="checkmark"></span>
                </label>
            `;
            habitsList.appendChild(habitElement);
        });
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }
}

const habitTracker = new HabitTracker(); 