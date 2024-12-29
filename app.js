let habits = [];

// Load habits from localStorage
function loadHabits() {
    const savedHabits = localStorage.getItem('habits');
    habits = savedHabits ? JSON.parse(savedHabits) : [];
    displayHabits();
}

// Save habits to localStorage
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Add new habit
function addHabit() {
    const input = document.getElementById('habitInput');
    const habitName = input.value.trim();
    
    if (habitName) {
        habits.push({
            name: habitName,
            completed: false,
            date: new Date().toISOString().split('T')[0],
            timer: 5, // Changed default timer from 60 to 5 seconds
            isRunning: false,
            remainingTime: 5 // Changed default remaining time to 5 seconds
        });
        saveHabits();
        displayHabits();
        input.value = '';
    }
}

// Toggle habit completion
function toggleHabit(index, event) {
    // Prevent the checkbox from triggering a form submission
    event.preventDefault();
    event.stopPropagation();
    
    habits[index].completed = !habits[index].completed;
    saveHabits();
    displayHabits();
}

// Adjust timer
function adjustTimer(index, seconds, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    habits[index].timer = Math.max(0, habits[index].timer + seconds);
    habits[index].remainingTime = habits[index].timer;
    saveHabits();
    displayHabits();
}

// Update the sound initialization
const timerEndSound = new Audio('./sounds/timer-end.mp3');

// Modify the preloadSound function
function preloadSound() {
    // Create a user interaction promise
    let userInteractionPromise = new Promise((resolve) => {
        document.addEventListener('click', function initSound() {
            document.removeEventListener('click', initSound);
            resolve();
        }, { once: true });
    });

    // Load the sound file
    timerEndSound.load();

    // Wait for both user interaction and sound loading
    return Promise.all([
        userInteractionPromise,
        new Promise((resolve) => {
            timerEndSound.addEventListener('canplaythrough', resolve, { once: true });
        })
    ]).catch(error => console.log('Sound initialization error:', error));
}

// Add this function to test sound
function testSound() {
    timerEndSound.play()
        .then(() => console.log('Sound played successfully'))
        .catch(error => console.log('Error playing sound:', error));
}

// Toggle timer
function toggleTimer(index, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const habit = habits[index];
    habit.isRunning = !habit.isRunning;
    
    if (habit.isRunning) {
        habit.timerId = setInterval(() => {
            if (habit.remainingTime > 0) {
                habit.remainingTime--;
                updateTimerDisplay(index);
            } else {
                clearInterval(habit.timerId);
                habit.isRunning = false;
                habit.remainingTime = habit.timer;
                
                // Play sound with better error handling
                playTimerEndSound();
                
                habit.completed = true;
                saveHabits();
                displayHabits();
            }
        }, 1000);
    } else {
        clearInterval(habit.timerId);
    }
    displayHabits();
}

// Update timer display
function updateTimerDisplay(index) {
    const timerElement = document.getElementById(`timer-${index}`);
    if (timerElement) {
        const minutes = Math.floor(habits[index].remainingTime / 60);
        const seconds = habits[index].remainingTime % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Display habits
function displayHabits() {
    const habitList = document.getElementById('habitList');
    habitList.innerHTML = '';
    
    if (habits.length === 0) {
        habitList.innerHTML = `
            <div class="text-center py-10 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-lg font-medium">No habits yet</p>
                <p class="mt-1">Add your first habit to get started!</p>
            </div>
        `;
        return;
    }
    
    habits.forEach((habit, index) => {
        const div = document.createElement('div');
        div.className = `p-5 rounded-2xl border ${habit.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} transition-all duration-300 shadow hover:shadow-lg`;
        
        const timeAgo = getTimeAgo(habit.date);
        const minutes = Math.floor(habit.remainingTime / 60);
        const seconds = habit.remainingTime % 60;
        
        div.innerHTML = `
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <input type="checkbox" 
                               class="w-6 h-6 rounded-full border-2 border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                               ${habit.completed ? 'checked' : ''} 
                               onclick="toggleHabit(${index}, event)">
                    </div>
                    <div class="flex flex-col flex-1 min-w-0 gap-1">
                        <span class="text-lg font-medium text-gray-800 leading-tight ${habit.completed ? 'line-through text-gray-500' : ''} truncate">
                            ${habit.name}
                        </span>
                        <span class="text-sm text-gray-500">${timeAgo}</span>
                    </div>
                    <button onclick="deleteHabit(${index})" 
                            class="text-gray-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <button onclick="adjustTimer(${index}, -5, event)" 
                                class="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-lg text-xl font-medium transition-colors">
                            -
                        </button>
                        <div class="flex-1 text-center">
                            <span id="timer-${index}" class="font-mono text-2xl font-semibold">
                                ${minutes}:${seconds.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <button onclick="adjustTimer(${index}, 5, event)" 
                                class="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-lg text-xl font-medium transition-colors">
                            +
                        </button>
                    </div>
                    <button onclick="toggleTimer(${index}, event)" 
                            class="w-full h-14 flex items-center justify-center gap-3 ${habit.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-xl transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md active:transform active:scale-98">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="${habit.isRunning 
                                      ? 'M10 9v6m4-6v6m-9-3a9 9 0 1118 0 9 9 0 01-18 0z' 
                                      : 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}" />
                        </svg>
                        ${habit.isRunning ? 'Pause Timer' : 'Start Timer'}
                    </button>
                </div>
            </div>
        `;
        
        // Add click handler to the entire card (optional)
        div.addEventListener('click', (e) => {
            // Prevent clicking the card if clicking on buttons or checkbox
            if (!e.target.closest('button') && !e.target.closest('input[type="checkbox"]')) {
                toggleHabit(index, e);
            }
        });
        
        habitList.appendChild(div);
    });
}

function deleteHabit(index) {
    habits.splice(index, 1);
    saveHabits();
    displayHabits();
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

// Add new function to handle sound playing
function playTimerEndSound() {
    // Reset the sound to beginning
    timerEndSound.currentTime = 0;
    
    // Play the sound with proper error handling
    timerEndSound.play().catch(error => {
        console.error('Initial sound play failed:', error);
        // Retry once
        timerEndSound.load();
        setTimeout(() => {
            timerEndSound.play().catch(e => 
                console.error('Retry sound play failed:', e)
            );
        }, 100);
    });
}

// Make sure to initialize the sound when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHabits();
    preloadSound();
});
