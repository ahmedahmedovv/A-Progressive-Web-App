class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.init();
    }

    init() {
        this.renderHabits();
        this.setupEventListeners();
        this.updateStats();
        this.displayCurrentDate();
    }

    displayCurrentDate() {
        const dateDisplay = document.getElementById('currentDate');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
    }

    showNotification(message, type = 'success') {
        const snackbar = document.getElementById('snackbar');
        snackbar.className = `show ${type}`;
        snackbar.textContent = message;
        setTimeout(() => {
            snackbar.className = snackbar.className.replace('show', '');
        }, 3000);
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

        document.getElementById('habitInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addHabit();
            }
        });
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const category = document.getElementById('habitCategory');
        const habitName = input.value.trim();
        
        if (habitName) {
            const newHabit = {
                id: Date.now(),
                name: habitName,
                category: category.value,
                dates: {},
                streak: 0,
                created: new Date().toISOString()
            };
            
            this.habits.unshift(newHabit); // Add to beginning of array
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            input.value = '';
            this.showNotification('Habit added successfully!');
        }
    }

    updateStats() {
        const totalHabits = document.getElementById('totalHabits');
        const completedToday = document.getElementById('completedToday');
        
        totalHabits.textContent = this.habits.length;
        
        const today = new Date().toDateString();
        const completed = this.habits.filter(habit => habit.dates[today]).length;
        completedToday.textContent = `${completed}/${this.habits.length}`;
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        habitsList.innerHTML = '';

        if (this.habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state animate__animated animate__fadeIn">
                    <p>No habits added yet. Start by adding a new habit above!</p>
                </div>
            `;
            return;
        }

        this.habits.forEach((habit, index) => {
            const today = new Date().toDateString();
            const isChecked = habit.dates[today] ? 'checked' : '';
            
            const habitElement = document.createElement('div');
            habitElement.className = 'habit-item animate__animated animate__fadeIn';
            habitElement.style.animationDelay = `${index * 0.1}s`;
            
            habitElement.innerHTML = `
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    <span class="habit-category">${habit.category}</span>
                    <span class="streak">🔥 ${habit.streak} day streak</span>
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