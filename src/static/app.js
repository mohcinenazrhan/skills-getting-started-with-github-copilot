document.addEventListener('DOMContentLoaded', async function() {
    await loadActivities();
    setupSignupForm();
});

async function loadActivities() {
    try {
        const response = await fetch('/activities');
        const activities = await response.json();
        
        displayActivities(activities);
        populateActivitySelect(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activities-list').innerHTML = '<p>Error loading activities.</p>';
    }
}

function displayActivities(activities) {
    const container = document.getElementById('activities-list');
    container.innerHTML = '';
    
    for (const [name, details] of Object.entries(activities)) {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        
        // Generate participants list
        let participantsHtml = '';
        if (details.participants && details.participants.length > 0) {
            const participantItems = details.participants.map(email => 
                `<li>
                    <span class="participant-email">${email}</span>
                    <button class="delete-participant-btn" onclick="unregisterParticipant('${name}', '${email}')">
                    </button>
                </li>`
            ).join('');
            participantsHtml = `
                <div class="participants-section">
                    <h5>Current Participants (${details.participants.length}/${details.max_participants}):</h5>
                    <ul class="participants-list">
                        ${participantItems}
                    </ul>
                </div>
            `;
        } else {
            participantsHtml = `
                <div class="participants-section">
                    <h5>Current Participants (0/${details.max_participants}):</h5>
                    <p class="no-participants">No participants yet. Be the first to sign up!</p>
                </div>
            `;
        }
        
        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Max Participants:</strong> ${details.max_participants}</p>
            ${participantsHtml}
        `;
        
        container.appendChild(activityCard);
    }
}

function populateActivitySelect(activities) {
    const select = document.getElementById('activity');
    select.innerHTML = '<option value="">-- Select an activity --</option>';
    
    for (const activityName of Object.keys(activities)) {
        const option = document.createElement('option');
        option.value = activityName;
        option.textContent = activityName;
        select.appendChild(option);
    }
}

function setupSignupForm() {
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const activity = document.getElementById('activity').value;
        
        if (!email || !activity) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }
        
        try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                showMessage(result.message, 'success');
                form.reset();
                await loadActivities(); // Refresh the activities to show updated participants
            } else {
                const error = await response.json();
                showMessage(error.detail, 'error');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            showMessage('An error occurred while signing up.', 'error');
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

async function unregisterParticipant(activityName, email) {
    if (!confirm(`Are you sure you want to unregister ${email} from ${activityName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            await loadActivities(); // Refresh the activities to show updated participants
        } else {
            const error = await response.json();
            showMessage(error.detail, 'error');
        }
    } catch (error) {
        console.error('Error unregistering participant:', error);
        showMessage('An error occurred while unregistering the participant.', 'error');
    }
}
