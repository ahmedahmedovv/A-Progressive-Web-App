class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.activeTimers = new Map();
        this.init();
    }

    init() {
        this.renderHabits();
        this.setupEventListeners();
        this.updateProgress();
        this.displayDate();
        this.updateAppBadge();
        
        // Set up periodic badge updates
        setInterval(() => this.updateAppBadge(), 60000); // Update every minute
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
            if (habit.dates[today]) {
                // If unchecking
                delete habit.dates[today];
                this.stopTimer(id);
            } else {
                // If checking
                habit.dates[today] = true;
                this.startTimer(id);
            }
            
            this.updateStreak(habit);
            this.saveAndUpdate();
            
            // Request background sync for badge update
            if ('serviceWorker' in navigator && 'sync' in registration) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.sync.register('update-badge');
                });
            } else {
                this.updateAppBadge();
            }
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
                ${!habit.dates[today] ? '<div class="badge"></div>' : ''}
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
        this.updateAppBadge();
    }

    showNotification(message) {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.classList.add('show');
        setTimeout(() => snackbar.classList.remove('show'), 2000);
    }

    async updateAppBadge() {
        try {
            const today = new Date().toDateString();
            const uncompleted = this.habits.filter(h => !h.dates[today]).length;
            
            if ('ExperimentalBadge' in window) {
                // Chrome implementation
                await window.ExperimentalBadge.set(uncompleted);
            } else if ('setAppBadge' in navigator) {
                // Standard implementation
                if (uncompleted > 0) {
                    await navigator.setAppBadge(uncompleted);
                } else {
                    await navigator.clearAppBadge();
                }
            }
        } catch (error) {
            console.log('Badge update failed:', error);
        }
    }

    startTimer(habitId) {
        // Show a prompt to open system timer
        const shouldOpenTimer = confirm('Would you like to set a 1-minute timer in your Clock app?');
        
        if (shouldOpenTimer) {
            // Try different deep link formats for iOS timer
            const timerLinks = [
                'shortcuts://x-callback-url/run-shortcut?name=Set1MinuteTimer',
                'clock:///timer',
                'clock:timer',
                'clock://',
                'clock://timer'
            ];

            // Try each link format
            const tryNextLink = (index) => {
                if (index < timerLinks.length) {
                    setTimeout(() => {
                        window.location.href = timerLinks[index];
                    }, 100);
                }
            };

            tryNextLink(0);
        }
        
        // Continue with visual timer in the app
        const timerDuration = 60; // 1 minute in seconds
        let timeLeft = timerDuration;
        
        const timer = setInterval(() => {
            timeLeft--;
            this.updateTimerDisplay(habitId, timeLeft);
            
            if (timeLeft <= 0) {
                this.stopTimer(habitId);
                this.showNotification('Timer completed!');
            }
        }, 1000);
        
        this.activeTimers.set(habitId, timer);
        this.updateTimerDisplay(habitId, timerDuration);
    }

    stopTimer(habitId) {
        if (this.activeTimers.has(habitId)) {
            clearInterval(this.activeTimers.get(habitId));
            this.activeTimers.delete(habitId);
            this.updateTimerDisplay(habitId, null);
        }
    }

    updateTimerDisplay(habitId, seconds) {
        const habitElement = document.querySelector(`.habit-item[data-id="${habitId}"]`);
        if (!habitElement) return;
        
        let timerElement = habitElement.querySelector('.timer');
        if (!timerElement && seconds !== null) {
            timerElement = document.createElement('div');
            timerElement.className = 'timer';
            habitElement.querySelector('.habit-info').appendChild(timerElement);
        }
        
        if (timerElement) {
            if (seconds === null) {
                timerElement.remove();
            } else {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        }
    }
}

// Register service worker with proper error handling
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registration successful');
            
            if ('sync' in registration) {
                await registration.sync.register('update-badge');
            }
        } catch (err) {
            console.log('ServiceWorker registration failed: ', err);
        }
    });
}

window.habitTracker = new HabitTracker(); 