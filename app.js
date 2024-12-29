class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.activeTimers = new Map();
        this.timerSound = new Audio('./sounds/timer-end.mp3');
        this.timerSound.preload = 'auto';
        this.timerSound.load();
        
        // Pre-load audio on first user interaction
        document.addEventListener('touchstart', () => {
            this.timerSound.load();
            this.timerSound.play().then(() => {
                this.timerSound.pause();
                this.timerSound.currentTime = 0;
            }).catch(error => {
                console.log('Audio pre-load failed:', error);
            });
        }, { once: true });
        
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
                streak: 0,
                timerDuration: 5 // default duration in seconds
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
                    <div class="timer-settings">
                        <input type="number" 
                               class="timer-input" 
                               value="${habit.timerDuration}"
                               min="1"
                               max="3600"
                               pattern="[0-9]*"
                               inputmode="numeric"
                               onchange="habitTracker.updateTimerDuration(${habit.id}, this.value)">
                        <span class="timer-label">seconds</span>
                    </div>
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
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const timerDuration = habit.timerDuration; // Use habit-specific duration
        let timeLeft = timerDuration;
        
        const timer = setInterval(() => {
            timeLeft--;
            this.updateTimerDisplay(habitId, timeLeft);
            
            if (timeLeft <= 0) {
                this.stopTimer(habitId);
                const playSound = async () => {
                    try {
                        await this.timerSound.play();
                    } catch (error) {
                        console.log('Sound playback error:', error);
                        try {
                            const fallbackSound = new Audio('./sounds/timer-end.mp3');
                            await fallbackSound.play();
                        } catch (fallbackError) {
                            console.log('Fallback sound failed:', fallbackError);
                        }
                    }
                };
                playSound();
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

    updateTimerDuration(habitId, newDuration) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            habit.timerDuration = Math.max(1, Math.min(3600, parseInt(newDuration) || 5));
            this.saveAndUpdate();
        }
    }
}

// Register service worker with proper error handling
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Unregister old service worker
            const registrations = await navigator.serviceWorker.getRegistrations();
            for(let registration of registrations) {
                await registration.unregister();
            }
            
            // Register new service worker
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registration successful');
        } catch (err) {
            console.log('ServiceWorker registration failed: ', err);
        }
    });
}

window.habitTracker = new HabitTracker(); 